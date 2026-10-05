// Single source of truth for the event's calendar text + time math, shared between
// the .ics generator (server), the "Add to calendar" menu (client), and the email template (server).

export const EVENT_TITLE = 'ICONIC Residences - First in Place Reveal'
export const EVENT_LOCATION = 'Lobby of Al Salam Tower, Dubai Internet City'
export const EVENT_DESCRIPTION = "You're registered for the First in Place Reveal at ICONIC Residences."

// Dubai is a fixed UTC+4 offset with no DST, so converting to UTC is a plain subtraction —
// no timezone database or VTIMEZONE block needed.
const DUBAI_UTC_OFFSET_HOURS = 4

export function dubaiLocalToUtc(eventDate: string, time: string): Date {
  const [y, m, d] = eventDate.split('-').map(Number)
  const [hh, mm, ss] = time.split(':').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hh, mm, ss) - DUBAI_UTC_OFFSET_HOURS * 60 * 60 * 1000)
}

// 'YYYYMMDDTHHMMSSZ' — used by both the .ics DTSTART/DTEND fields and Google Calendar's `dates` param.
export function formatUtcCompact(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

interface CalendarLinksInput {
  eventDate: string // 'YYYY-MM-DD', local to Asia/Dubai
  startTime: string // 'HH:MM:SS', local to Asia/Dubai
  endTime: string // 'HH:MM:SS', local to Asia/Dubai
  icsUrl: string
}

export interface CalendarLinks {
  google: string
  outlook: string
  apple: string
}

// Google/Outlook links are plain pre-filled "create event" URLs — no OAuth, no API keys,
// just query params. They still require the user to hit Save on the provider's page.
export function buildCalendarLinks(input: CalendarLinksInput): CalendarLinks {
  const start = dubaiLocalToUtc(input.eventDate, input.startTime)
  const end = dubaiLocalToUtc(input.eventDate, input.endTime)

  const google = `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENT_TITLE,
    dates: `${formatUtcCompact(start)}/${formatUtcCompact(end)}`,
    details: EVENT_DESCRIPTION,
    location: EVENT_LOCATION
  })}`

  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?${new URLSearchParams({
    subject: EVENT_TITLE,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: EVENT_DESCRIPTION,
    location: EVENT_LOCATION,
    path: '/calendar/action/compose',
    rru: 'addevent'
  })}`

  return { google, outlook, apple: input.icsUrl }
}
