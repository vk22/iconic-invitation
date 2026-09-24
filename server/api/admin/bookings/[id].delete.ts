import { eq, sql } from 'drizzle-orm'
import { useDb } from '../../../db/client'
import { bookings, eventSlots, registrations } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing booking id' })
  }

  const db = useDb()

  await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, id)).limit(1)

    if (!booking || booking.status !== 'confirmed') {
      throw createError({ statusCode: 404, statusMessage: 'Booking not found or already cancelled' })
    }

    await tx.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, id))
    await tx.update(registrations).set({ status: 'cancelled' }).where(eq(registrations.bookingId, id))
    await tx
      .update(eventSlots)
      .set({ bookedCount: sql`${eventSlots.bookedCount} - ${booking.guestCount}` })
      .where(eq(eventSlots.id, booking.slotId))
  })

  return { ok: true }
})
