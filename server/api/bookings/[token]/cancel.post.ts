import { eq, sql } from 'drizzle-orm'
import { useDb } from '../../../db/client'
import { bookings, eventSlots, registrations } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const db = useDb()

  await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.manageToken, token)).limit(1)

    if (!booking) {
      throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
    }

    if (booking.status !== 'confirmed') {
      throw createError({ statusCode: 409, statusMessage: 'This booking is already cancelled' })
    }

    await tx.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, booking.id))
    await tx.update(registrations).set({ status: 'cancelled' }).where(eq(registrations.bookingId, booking.id))
    await tx
      .update(eventSlots)
      .set({ bookedCount: sql`${eventSlots.bookedCount} - ${booking.guestCount}` })
      .where(eq(eventSlots.id, booking.slotId))
  })

  return { ok: true }
})
