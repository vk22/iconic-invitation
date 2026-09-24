import { and, eq, sql } from 'drizzle-orm'
import { rescheduleInputSchema } from '../../../../shared/schemas/booking'
import { useDb } from '../../../db/client'
import { bookings, eventSlots } from '../../../db/schema'
import { SlotCapacityError } from '../../../utils/db-errors'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const body = await readBody(event)
  const parsed = rescheduleInputSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid slot' })
  }
  const { slotId: newSlotId } = parsed.data

  const db = useDb()

  try {
    const slot = await db.transaction(async (tx) => {
      const [booking] = await tx.select().from(bookings).where(eq(bookings.manageToken, token)).limit(1)

      if (!booking) {
        throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
      }
      if (booking.status !== 'confirmed') {
        throw createError({ statusCode: 409, statusMessage: 'This booking is cancelled' })
      }

      if (booking.slotId === newSlotId) {
        const [current] = await tx.select().from(eventSlots).where(eq(eventSlots.id, newSlotId)).limit(1)
        return current
      }

      await tx
        .update(eventSlots)
        .set({ bookedCount: sql`${eventSlots.bookedCount} - ${booking.guestCount}` })
        .where(eq(eventSlots.id, booking.slotId))

      const updatedNewSlots = await tx
        .update(eventSlots)
        .set({ bookedCount: sql`${eventSlots.bookedCount} + ${booking.guestCount}` })
        .where(
          and(eq(eventSlots.id, newSlotId), sql`${eventSlots.bookedCount} + ${booking.guestCount} <= ${eventSlots.capacity}`)
        )
        .returning()

      if (updatedNewSlots.length === 0) {
        throw new SlotCapacityError()
      }

      await tx.update(bookings).set({ slotId: newSlotId }).where(eq(bookings.id, booking.id))

      return updatedNewSlots[0]
    })

    return {
      slot: { eventDate: slot!.eventDate, startTime: slot!.startTime, endTime: slot!.endTime }
    }
  } catch (err) {
    if (err instanceof SlotCapacityError) {
      throw createError({ statusCode: 409, statusMessage: 'Not enough spots left in the new slot' })
    }
    throw err
  }
})
