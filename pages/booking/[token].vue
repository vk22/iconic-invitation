<script setup lang="ts">
const EVENT_DATES = ['2026-10-13', '2026-10-14', '2026-10-15']

function dayLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
}

interface BookingDto {
  id: string
  company: string
  guestCount: number
  status: string
  slotId: string
  eventDate: string
  startTime: string
  endTime: string
  guests: { firstName: string; lastName: string; phone: string; email: string }[]
}

const route = useRoute()
const token = route.params.token as string

const { data: booking, refresh, error } = await useFetch<BookingDto>(`/api/bookings/${token}`)

const { slots, refreshSlots } = useEventSlots()

const rescheduling = ref(false)
const rescheduleDate = ref(EVENT_DATES[0])
const rescheduleSlotId = ref<string | null>(null)
const actionError = ref<string | null>(null)
const actionPending = ref(false)

const slotsForRescheduleDate = computed(() => (slots.value ?? []).filter((s) => s.eventDate === rescheduleDate.value))

function selectRescheduleDate(date: string) {
  rescheduleDate.value = date
  rescheduleSlotId.value = null
}

function startReschedule() {
  rescheduling.value = true
  rescheduleDate.value = booking.value?.eventDate ?? EVENT_DATES[0]
  rescheduleSlotId.value = null
  actionError.value = null
}

function cancelReschedule() {
  rescheduling.value = false
  actionError.value = null
}

async function confirmReschedule() {
  if (!rescheduleSlotId.value) return
  actionPending.value = true
  actionError.value = null
  try {
    await $fetch(`/api/bookings/${token}/reschedule`, {
      method: 'POST',
      body: { slotId: rescheduleSlotId.value }
    })
    rescheduling.value = false
    await Promise.all([refresh(), refreshSlots()])
  } catch (err: any) {
    const status = err?.data?.statusCode ?? err?.statusCode
    actionError.value =
      status === 409
        ? 'Not enough spots left in that slot for your whole group — please pick another one.'
        : 'Something went wrong. Please try again.'
  } finally {
    actionPending.value = false
  }
}

async function cancelBooking() {
  if (!confirm('Cancel this booking for your whole group?')) return
  actionPending.value = true
  actionError.value = null
  try {
    await $fetch(`/api/bookings/${token}/cancel`, { method: 'POST' })
    await Promise.all([refresh(), refreshSlots()])
  } catch {
    actionError.value = 'Something went wrong. Please try again.'
  } finally {
    actionPending.value = false
  }
}
</script>

<template>
  <main class="mx-auto min-h-screen max-w-xl px-4 py-10">
    <div v-if="error" class="text-center">
      <h1 class="text-2xl font-semibold">Booking not found</h1>
      <p class="mt-2 text-gray-600">This link doesn't match any booking.</p>
    </div>

    <div v-else-if="booking">
      <h1 class="text-2xl font-semibold">Your booking</h1>

      <div v-if="booking.status === 'cancelled'" class="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-gray-600">
        This booking has been cancelled.
      </div>

      <div class="mt-4 rounded-lg border border-gray-200 p-5">
        <p class="font-medium text-gray-900">
          {{ dayLabel(booking.eventDate) }}, {{ booking.startTime.slice(0, 5) }}–{{ booking.endTime.slice(0, 5) }}
        </p>
        <p class="text-gray-600">Lobby of Al Salam Tower, Dubai Internet City</p>
        <p class="mt-2 text-sm text-gray-500">{{ booking.company }} · {{ booking.guestCount }} guest(s)</p>

        <ul class="mt-4 space-y-2 text-sm">
          <li v-for="(g, i) in booking.guests" :key="i" class="border-t border-gray-100 pt-2 first:border-0 first:pt-0">
            <div class="font-medium text-gray-900">{{ g.firstName }} {{ g.lastName }}</div>
            <div class="text-gray-500">{{ g.phone }} · {{ g.email }}</div>
          </li>
        </ul>
      </div>

      <template v-if="booking.status === 'confirmed' && !rescheduling">
        <div class="mt-6 flex gap-3">
          <button
            type="button"
            class="min-h-[48px] flex-1 rounded-md border border-gray-300 px-4 py-3 text-base font-medium text-gray-700"
            :disabled="actionPending"
            @click="startReschedule"
          >
            Reschedule
          </button>
          <button
            type="button"
            class="min-h-[48px] flex-1 rounded-md border border-red-200 px-4 py-3 text-base font-medium text-red-600"
            :disabled="actionPending"
            @click="cancelBooking"
          >
            Cancel booking
          </button>
        </div>
      </template>

      <section v-if="rescheduling" class="mt-6">
        <h2 class="text-lg font-semibold">Choose a new time slot</h2>

        <div class="mt-3 flex gap-2">
          <button
            v-for="date in EVENT_DATES"
            :key="date"
            type="button"
            class="min-h-[44px] flex-1 rounded-md border px-3 py-2 text-sm font-medium"
            :class="
              rescheduleDate === date
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-700'
            "
            @click="selectRescheduleDate(date)"
          >
            {{ dayLabel(date) }}
          </button>
        </div>

        <div class="mt-4">
          <SlotGrid
            :slots="slotsForRescheduleDate"
            :selected-slot-id="rescheduleSlotId"
            @select="(id) => (rescheduleSlotId = id)"
          />
        </div>

        <div class="mt-4 flex gap-3">
          <button
            type="button"
            class="min-h-[48px] flex-1 rounded-md border border-gray-300 px-4 py-3 text-base font-medium text-gray-700"
            @click="cancelReschedule"
          >
            Back
          </button>
          <button
            type="button"
            :disabled="!rescheduleSlotId || actionPending"
            class="min-h-[48px] flex-1 rounded-md bg-gray-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50"
            @click="confirmReschedule"
          >
            {{ actionPending ? 'Saving…' : 'Confirm new slot' }}
          </button>
        </div>
      </section>

      <p v-if="actionError" class="mt-4 text-sm text-red-600">{{ actionError }}</p>
    </div>
  </main>
</template>
