import { and, asc, eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { bookings, eventSlots, registrations } from '../../db/schema'

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

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

  const rows = await db
    .select({
      firstName: registrations.firstName,
      lastName: registrations.lastName,
      phone: registrations.phone,
      email: registrations.email,
      company: bookings.company,
      guestCount: bookings.guestCount,
      status: bookings.status,
      createdAt: bookings.createdAt,
      eventDate: eventSlots.eventDate,
      startTime: eventSlots.startTime,
      endTime: eventSlots.endTime
    })
    .from(registrations)
    .innerJoin(bookings, eq(registrations.bookingId, bookings.id))
    .innerJoin(eventSlots, eq(bookings.slotId, eventSlots.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(eventSlots.eventDate), asc(eventSlots.startTime), asc(bookings.createdAt))

  const header = ['First name', 'Last name', 'Phone', 'Email', 'Company', 'Group size', 'Day', 'Slot', 'Status', 'Booked at']
  const lines = rows.map((r) =>
    [
      r.firstName,
      r.lastName,
      r.phone,
      r.email,
      r.company,
      r.guestCount,
      r.eventDate,
      `${r.startTime}-${r.endTime}`,
      r.status,
      r.createdAt.toISOString()
    ]
      .map((v) => csvEscape(String(v)))
      .join(',')
  )

  const csv = [header.join(','), ...lines].join('\n')

  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="bookings.csv"')

  return '﻿' + csv
})
