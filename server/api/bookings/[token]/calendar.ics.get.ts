import { eq } from 'drizzle-orm'
import { useDb } from '../../../db/client'
import { bookings, eventSlots } from '../../../db/schema'
import { generateBookingIcs } from '../../../utils/ics'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Missing token' })
  }

  const db = useDb()

  const [booking] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      eventDate: eventSlots.eventDate,
      startTime: eventSlots.startTime,
      endTime: eventSlots.endTime
    })
    .from(bookings)
    .innerJoin(eventSlots, eq(bookings.slotId, eventSlots.id))
    .where(eq(bookings.manageToken, token))
    .limit(1)

  if (!booking || booking.status !== 'confirmed') {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found' })
  }

  const ics = generateBookingIcs({
    uid: booking.id,
    eventDate: booking.eventDate,
    startTime: booking.startTime,
    endTime: booking.endTime
  })

  setResponseHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="iconic-residences-reveal.ics"')

  return ics
})
