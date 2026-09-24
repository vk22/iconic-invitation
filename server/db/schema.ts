import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'

export const eventSlots = pgTable(
  'event_slots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventDate: date('event_date').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    capacity: integer('capacity').notNull().default(15),
    // Admin can override capacity (VIP add), so this is not capped by a CHECK — only guarded against going negative.
    bookedCount: integer('booked_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check('booked_count_non_negative', sql`${table.bookedCount} >= 0`),
    unique('event_slots_date_start_unique').on(table.eventDate, table.startTime)
  ]
)

// One booking = one company party (the booker + optional colleagues) occupying `guestCount` seats in a slot.
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slotId: uuid('slot_id')
      .notNull()
      .references(() => eventSlots.id),
    company: text('company').notNull(),
    guestCount: integer('guest_count').notNull(),
    // Unguessable bearer token for the self-service manage page (no login system).
    manageToken: uuid('manage_token').notNull().defaultRandom(),
    status: text('status').notNull().default('confirmed'), // 'confirmed' | 'cancelled'
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull().defaultNow(),
    createdByAdmin: boolean('created_by_admin').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex('bookings_manage_token_unique').on(table.manageToken)]
)

// One row per guest within a booking (the booker is guests[0]).
export const registrations = pgTable(
  'registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email').notNull(),
    // Denormalized from the parent booking so the partial unique index below can enforce
    // "one active registration per phone" without a cross-table constraint.
    status: text('status').notNull().default('confirmed'), // 'confirmed' | 'cancelled'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('registrations_phone_confirmed_unique')
      .on(table.phone)
      .where(sql`${table.status} = 'confirmed'`)
  ]
)
