import { asc } from 'drizzle-orm'
import { useDb } from '../db/client'
import { eventSlots } from '../db/schema'

export default defineEventHandler(async () => {
  const db = useDb()

  const slots = await db
    .select()
    .from(eventSlots)
    .orderBy(asc(eventSlots.eventDate), asc(eventSlots.startTime))

  return slots.map((slot) => ({
    id: slot.id,
    eventDate: slot.eventDate,
    startTime: slot.startTime,
    endTime: slot.endTime,
    capacity: slot.capacity,
    remaining: Math.max(0, slot.capacity - slot.bookedCount)
  }))
})
