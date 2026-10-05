import { buildCalendarLinks } from '../../shared/utils/calendar'

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

// Thin wrapper around Resend's REST API — no SDK dependency needed for a single endpoint.
// Failures are logged by the caller and must never block the booking flow itself.
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const { resendApiKey, resendFromEmail } = useRuntimeConfig()

  if (!resendApiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping send', { to, subject })
    return
  }

  const res = await $fetch.raw('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}` },
    body: { from: resendFromEmail, to, subject, html },
    ignoreResponseError: true
  })

  if (res.status >= 400) {
    throw new Error(`Resend API error ${res.status}: ${JSON.stringify(res._data)}`)
  }
}

interface BookingConfirmationInput {
  guestFirstName: string
  company: string
  eventDate: string
  startTime: string
  endTime: string
  manageUrl: string
  icsUrl: string
}

function formatEventDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(y, m - 1, d)
  )
}

export function bookingConfirmationEmail(input: BookingConfirmationInput) {
  const timeRange = `${input.startTime.slice(0, 5)}–${input.endTime.slice(0, 5)}`
  const dateLabel = formatEventDate(input.eventDate)
  const calendarLinks = buildCalendarLinks({
    eventDate: input.eventDate,
    startTime: input.startTime,
    endTime: input.endTime,
    icsUrl: input.icsUrl
  })

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:480px;background:#141414;border:1px solid rgba(255,255,255,0.15);border-radius:4px;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:32px 32px 8px;text-align:center;color:#ffffff;">
                <div style="font-size:12px;letter-spacing:2px;color:rgba(255,255,255,0.5);text-transform:uppercase;">ICONIC Residences</div>
                <h1 style="font-size:24px;font-weight:400;margin:16px 0 0;">You're registered!</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;color:rgba(255,255,255,0.8);font-size:15px;line-height:1.6;">
                <p style="margin:0 0 4px;">Hi ${input.guestFirstName},</p>
                <p style="margin:0 0 16px;">Your registration for ${input.company} is confirmed for the First in Place Reveal.</p>
                <table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid rgba(255,255,255,0.15);border-bottom:1px solid rgba(255,255,255,0.15);margin:16px 0;">
                  <tr>
                    <td style="padding:12px 0;color:#ffffff;">
                      <strong>${dateLabel}</strong><br />
                      ${timeRange}<br />
                      Lobby of Al Salam Tower, Dubai Internet City
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 24px;">Need to reschedule or cancel? Use your personal link below.</p>
                <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td style="border:1px solid rgba(255,255,255,0.5);border-radius:4px;">
                      <a href="${input.manageUrl}" style="display:block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;">Manage my booking</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0;font-size:13px;color:rgba(255,255,255,0.5);text-align:center;">
                  Add to calendar:
                  <a href="${calendarLinks.google}" style="color:#ffffff;">Google</a> ·
                  <a href="${calendarLinks.outlook}" style="color:#ffffff;">Outlook</a> ·
                  <a href="${calendarLinks.apple}" style="color:#ffffff;">Apple / Other</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;text-align:center;color:rgba(255,255,255,0.4);font-size:12px;">
                We look forward to welcoming you.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject: `You're registered — ${dateLabel}, ${timeRange}`, html }
}
