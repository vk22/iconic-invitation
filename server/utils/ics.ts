import { dubaiLocalToUtc, EVENT_DESCRIPTION, EVENT_LOCATION, EVENT_TITLE, formatUtcCompact } from '../../shared/utils/calendar'

interface IcsEventInput {
  uid: string
  eventDate: string // 'YYYY-MM-DD', local to Asia/Dubai
  startTime: string // 'HH:MM:SS', local to Asia/Dubai
  endTime: string // 'HH:MM:SS', local to Asia/Dubai
}

// Escapes text per RFC 5545 §3.3.11 (comma, semicolon, backslash, newline).
function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

export function generateBookingIcs(input: IcsEventInput): string {
  const start = dubaiLocalToUtc(input.eventDate, input.startTime)
  const end = dubaiLocalToUtc(input.eventDate, input.endTime)
  const now = new Date()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ICONIC Residences//First in Place Reveal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}@mered.ae`,
    `DTSTAMP:${formatUtcCompact(now)}`,
    `DTSTART:${formatUtcCompact(start)}`,
    `DTEND:${formatUtcCompact(end)}`,
    `SUMMARY:${escapeIcsText(EVENT_TITLE)}`,
    `LOCATION:${escapeIcsText(EVENT_LOCATION)}`,
    `DESCRIPTION:${escapeIcsText(`${EVENT_DESCRIPTION}\nMeet in the lobby of Al Salam Tower, Dubai Internet City.`)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ]

  return lines.join('\r\n')
}
