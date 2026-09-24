import { isValidPhoneNumber } from 'libphonenumber-js'
import { z } from 'zod'

const MAX_GUESTS_PER_BOOKING = 10

export const guestSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  phone: z
    .string()
    .trim()
    .refine((value) => isValidPhoneNumber(value, 'AE'), 'Enter a valid phone number, including country code'),
  email: z.string().trim().email('Enter a valid email').max(200)
})

export type GuestInput = z.infer<typeof guestSchema>

function noDuplicatePhones(guests: GuestInput[]) {
  return new Set(guests.map((g) => g.phone)).size === guests.length
}

// Public booking form: booker + optional colleagues, requires consent.
export const bookingInputSchema = z.object({
  slotId: z.string().uuid(),
  company: z.string().trim().min(1, 'Company is required').max(200),
  consent: z.boolean().refine((value) => value === true, 'Consent to data processing is required'),
  guests: z
    .array(guestSchema)
    .min(1, 'At least one guest is required')
    .max(MAX_GUESTS_PER_BOOKING, `Maximum ${MAX_GUESTS_PER_BOOKING} guests per booking`)
    .refine(noDuplicatePhones, { message: 'Duplicate phone numbers in the same booking' })
})

export type BookingInput = z.infer<typeof bookingInputSchema>

// Admin manual add: staff enters on the guest's behalf, no consent checkbox.
export const adminBookingInputSchema = z.object({
  slotId: z.string().uuid(),
  company: z.string().trim().min(1, 'Company is required').max(200),
  guests: z
    .array(guestSchema)
    .min(1, 'At least one guest is required')
    .max(MAX_GUESTS_PER_BOOKING, `Maximum ${MAX_GUESTS_PER_BOOKING} guests per booking`)
    .refine(noDuplicatePhones, { message: 'Duplicate phone numbers in the same booking' })
})

export type AdminBookingInput = z.infer<typeof adminBookingInputSchema>

export const rescheduleInputSchema = z.object({
  slotId: z.string().uuid()
})
