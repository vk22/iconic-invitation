import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { bookings, eventSlots, registrations } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const db = useDb()

  const [booking] = await db
    .select({
      id: bookings.id,
      company: bookings.company,
      guestCount: bookings.guestCount,
      status: bookings.status,
      slotId: bookings.slotId,
      eventDate: eventSlots.eventDate,
      startTime: eventSlots.startTime,
      endTime: eventSlots.endTime
    })
    .from(bookings)
    .innerJoin(eventSlots, eq(bookings.slotId, eventSlots.id))
    .where(eq(bookings.manageToken, token))
    .limit(1)

  if (!booking) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  const guests = await db
    .select({
      firstName: registrations.firstName,
      lastName: registrations.lastName,
      phone: registrations.phone,
      email: registrations.email
    })
    .from(registrations)
    .where(eq(registrations.bookingId, booking.id))

  return { ...booking, guests }
})
