import { and, eq, sql } from 'drizzle-orm'
import { bookingInputSchema } from '../../shared/schemas/booking'
import { useDb } from '../db/client'
import { bookings, eventSlots, registrations } from '../db/schema'
import { extractConflictingPhone, isUniqueViolation, SlotCapacityError } from '../utils/db-errors'

const RATE_LIMIT = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (!checkRateLimit(`bookings:${ip}`, RATE_LIMIT, RATE_LIMIT_WINDOW_MS)) {
    console.warn('[bookings] 429 rate limit exceeded', { ip })
    throw createError({ statusCode: 429, statusMessage: 'Too many attempts, please try again later' })
  }

  const body = await readBody(event)
  const parsed = bookingInputSchema.safeParse(body)

  if (!parsed.success) {
    console.warn('[bookings] 400 validation failed', parsed.error.flatten())
    throw createError({ statusCode: 400, statusMessage: 'Invalid form data', data: { issues: parsed.error.issues } })
  }

  const { slotId, company, guests } = parsed.data
  const guestCount = guests.length
  const db = useDb()

  try {
    const result = await db.transaction(async (tx) => {
      const updatedSlots = await tx
        .update(eventSlots)
        .set({ bookedCount: sql`${eventSlots.bookedCount} + ${guestCount}` })
        .where(and(eq(eventSlots.id, slotId), sql`${eventSlots.bookedCount} + ${guestCount} <= ${eventSlots.capacity}`))
        .returning()

      if (updatedSlots.length === 0) {
        throw new SlotCapacityError()
      }

      const [booking] = await tx.insert(bookings).values({ slotId, company, guestCount }).returning()

      const insertedGuests = await tx
        .insert(registrations)
        .values(guests.map((g) => ({ bookingId: booking.id, ...g })))
        .returning()

      return { booking, guests: insertedGuests, slot: updatedSlots[0] }
    })

    return {
      manageToken: result.booking.manageToken,
      guestCount: result.guests.length,
      slot: {
        eventDate: result.slot.eventDate,
        startTime: result.slot.startTime,
        endTime: result.slot.endTime
      }
    }
  } catch (err) {
    if (err instanceof SlotCapacityError) {
      console.warn('[bookings] 409 not enough capacity', { slotId, guestCount })
      throw createError({ statusCode: 409, statusMessage: 'Not enough spots left in this slot' })
    }

    if (isUniqueViolation(err, 'registrations_phone_confirmed_unique')) {
      const phone = extractConflictingPhone(err)
      const [existing] = phone
        ? await db
            .select({
              eventDate: eventSlots.eventDate,
              startTime: eventSlots.startTime,
              endTime: eventSlots.endTime
            })
            .from(registrations)
            .innerJoin(bookings, eq(registrations.bookingId, bookings.id))
            .innerJoin(eventSlots, eq(bookings.slotId, eventSlots.id))
            .where(and(eq(registrations.phone, phone), eq(registrations.status, 'confirmed')))
            .limit(1)
        : []

      console.warn('[bookings] 409 duplicate phone', { phone })
      throw createError({
        statusCode: 409,
        statusMessage: 'This phone number is already registered',
        data: existing ? { existingSlot: existing } : undefined
      })
    }

    throw err
  }
})
