import { and, asc, eq, inArray } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { bookings, eventSlots, registrations } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const query = getQuery(event)
  const date = typeof query.date === 'string' ? query.date : undefined
  const slotId = typeof query.slotId === 'string' ? query.slotId : undefined

  const db = useDb()

  const conditions = [
    date ? eq(eventSlots.eventDate, date) : undefined,
    slotId ? eq(bookings.slotId, slotId) : undefined
  ].filter((c) => c !== undefined)

  const bookingRows = await db
    .select({
      id: bookings.id,
      company: bookings.company,
      guestCount: bookings.guestCount,
      status: bookings.status,
      createdByAdmin: bookings.createdByAdmin,
      createdAt: bookings.createdAt,
      slotId: bookings.slotId,
      eventDate: eventSlots.eventDate,
      startTime: eventSlots.startTime,
      endTime: eventSlots.endTime
    })
    .from(bookings)
    .innerJoin(eventSlots, eq(bookings.slotId, eventSlots.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(eventSlots.eventDate), asc(eventSlots.startTime), asc(bookings.createdAt))

  const bookingIds = bookingRows.map((b) => b.id)
  const guestRows = bookingIds.length
    ? await db
        .select({
          bookingId: registrations.bookingId,
          firstName: registrations.firstName,
          lastName: registrations.lastName,
          phone: registrations.phone,
          email: registrations.email
        })
        .from(registrations)
        .where(inArray(registrations.bookingId, bookingIds))
    : []

  const guestsByBooking = new Map<string, typeof guestRows>()
  for (const guest of guestRows) {
    const list = guestsByBooking.get(guest.bookingId) ?? []
    list.push(guest)
    guestsByBooking.set(guest.bookingId, list)
  }

  return bookingRows.map((b) => ({ ...b, guests: guestsByBooking.get(b.id) ?? [] }))
})
