import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eventSlots } from './schema'

const EVENT_DATES = ['2026-10-13', '2026-10-14', '2026-10-15']
const SLOT_START_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18]

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

const rows = EVENT_DATES.flatMap((eventDate) =>
  SLOT_START_HOURS.map((hour) => ({
    eventDate,
    startTime: `${pad(hour)}:00:00`,
    endTime: `${pad(hour)}:40:00`,
    capacity: 15,
    bookedCount: 0
  }))
)

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  await db
    .insert(eventSlots)
    .values(rows)
    .onConflictDoNothing({ target: [eventSlots.eventDate, eventSlots.startTime] })

  console.log(`Seeded ${rows.length} slots.`)
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
