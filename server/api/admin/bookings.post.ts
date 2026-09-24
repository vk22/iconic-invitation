import { eq, sql } from 'drizzle-orm'
import { adminBookingInputSchema } from '../../../shared/schemas/booking'
import { useDb } from '../../db/client'
import { bookings, eventSlots, registrations } from '../../db/schema'
import { extractConflictingPhone, isUniqueViolation } from '../../utils/db-errors'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const body = await readBody(event)
  const parsed = adminBookingInputSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid form data', data: { issues: parsed.error.issues } })
  }

  const { slotId, company, guests } = parsed.data
  const guestCount = guests.length
  const db = useDb()

  try {
    const result = await db.transaction(async (tx) => {
      // Admin adds bypass the capacity check by design (e.g. VIP added out of turn).
      const [slot] = await tx
        .update(eventSlots)
        .set({ bookedCount: sql`${eventSlots.bookedCount} + ${guestCount}` })
        .where(eq(eventSlots.id, slotId))
        .returning()

      if (!slot) {
        throw createError({ statusCode: 404, statusMessage: 'Slot not found' })
      }

      const [booking] = await tx
        .insert(bookings)
        .values({ slotId, company, guestCount, createdByAdmin: true })
        .returning()

      const insertedGuests = await tx
        .insert(registrations)
        .values(guests.map((g) => ({ bookingId: booking.id, ...g })))
        .returning()

      return { booking, guests: insertedGuests, slot }
    })

    if (result.slot.bookedCount > result.slot.capacity) {
      console.warn('[admin/bookings] slot booked over capacity by admin override', {
        slotId,
        bookedCount: result.slot.bookedCount,
        capacity: result.slot.capacity
      })
    }

    return { id: result.booking.id, manageToken: result.booking.manageToken }
  } catch (err) {
    if (isUniqueViolation(err, 'registrations_phone_confirmed_unique')) {
      const phone = extractConflictingPhone(err)
      throw createError({
        statusCode: 409,
        statusMessage: phone ? `Phone ${phone} is already registered` : 'A guest phone number is already registered'
      })
    }
    throw err
  }
})
