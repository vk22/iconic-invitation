<script setup lang="ts">
import type { SlotDto } from '~/composables/useEventSlots'

const EVENT_DATES = ['2026-10-13', '2026-10-14', '2026-10-15']

function dayLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
}

const { slots, refreshSlots } = useEventSlots()

const modalOpen = ref(false)
const selectedDate = ref(EVENT_DATES[0])
const selectedSlotId = ref<string | null>(null)
const step = ref<'grid' | 'form' | 'confirmation'>('grid')

const submitting = ref(false)
const formError = ref<string | null>(null)
const issues = ref<{ path: (string | number)[]; message: string }[] | null>(null)

const confirmedSlot = ref<{ eventDate: string; startTime: string; endTime: string } | null>(null)
const confirmedManageToken = ref<string | null>(null)

const slotsForSelectedDate = computed<SlotDto[]>(() =>
  (slots.value ?? []).filter((s) => s.eventDate === selectedDate.value)
)

const selectedSlot = computed(() => (slots.value ?? []).find((s) => s.id === selectedSlotId.value) ?? null)

function openModal() {
  modalOpen.value = true
}

function closeModal() {
  if (submitting.value) return
  modalOpen.value = false
  step.value = 'grid'
  selectedSlotId.value = null
  confirmedSlot.value = null
  confirmedManageToken.value = null
  formError.value = null
  issues.value = null
}

function selectDate(date: string) {
  selectedDate.value = date
  selectedSlotId.value = null
}

function selectSlot(slotId: string) {
  selectedSlotId.value = slotId
  step.value = 'form'
  formError.value = null
  issues.value = null
}

function backToGrid() {
  step.value = 'grid'
  formError.value = null
  issues.value = null
}

interface GuestData {
  firstName: string
  lastName: string
  phone: string
  email: string
}

async function handleSubmit(data: { company: string; consent: boolean; guests: GuestData[] }) {
  if (!selectedSlot.value) return

  formError.value = null
  issues.value = null

  await refreshSlots()
  const freshSlot = (slots.value ?? []).find((s) => s.id === selectedSlot.value?.id)
  if (!freshSlot || freshSlot.remaining < data.guests.length) {
    formError.value = 'This slot no longer has enough spots for your group — please choose another one.'
    step.value = 'grid'
    selectedSlotId.value = null
    return
  }

  submitting.value = true
  try {
    const res = await $fetch('/api/bookings', {
      method: 'POST',
      body: { slotId: selectedSlot.value.id, ...data }
    })
    confirmedSlot.value = res.slot
    confirmedManageToken.value = res.manageToken
    step.value = 'confirmation'
  } catch (err: any) {
    const status = err?.data?.statusCode ?? err?.statusCode
    const payload = err?.data?.data

    if (status === 400 && payload?.issues) {
      issues.value = payload.issues
    } else if (status === 409 && payload?.existingSlot) {
      const s = payload.existingSlot
      formError.value = `One of these phone numbers is already registered for ${dayLabel(s.eventDate)}, ${s.startTime.slice(0, 5)}–${s.endTime.slice(0, 5)}.`
    } else if (status === 409) {
      formError.value = 'This slot no longer has enough spots for your group — please choose another one.'
      await refreshSlots()
      step.value = 'grid'
      selectedSlotId.value = null
    } else if (status === 429) {
      formError.value = 'Too many attempts — please wait a few minutes and try again.'
    } else {
      formError.value = 'Something went wrong. Please try again.'
    }
  } finally {
    submitting.value = false
    await refreshSlots()
  }
}
</script>

<template>
  <main class="relative min-h-screen">
    <div class="fixed inset-0 -z-10">
      <img src="/img/main-img.jpg" alt="" class="h-full w-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-black/80" />
    </div>

    <div class="relative flex min-h-screen flex-col items-center px-4 py-10 text-center text-white sm:py-14">
      <img src="/img/iconic-logo.svg" alt="ICONIC Residences, design by Pininfarina" class="w-32 sm:w-40" />

      <h1 class="mt-10 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl">
        You're Invited to<br />
        ICONIC Residences'<br />
        <span class="italic">First in Place Reveal</span>
      </h1>

      <div class="mt-8 grid max-w-3xl gap-x-8 gap-y-4 text-sm text-white/90 sm:grid-cols-2 sm:text-base">
        <p>
          Join us for the exclusive reveal of the First in Place apartment at ICONIC Residences, designed by
          Pininfarina—the first completed home within this landmark development.
        </p>
        <p>
          In an intimate group of guests, you will be among the first to step inside the apartment, admire the
          views, capture photos and videos, and discover a few special surprises along the way.
        </p>
        <p>
          Your experience will begin in the lobby of Al Salam Tower, Dubai Internet City, where our team will
          welcome you before accompanying you to the construction site.
        </p>
        <p>After the tour, we would be delighted to host you for refreshments and light bites.</p>
      </div>

      <dl class="mt-8 w-full max-w-md space-y-2 rounded-lg border border-white/30 p-5 text-left text-sm sm:text-base">
        <div><dt class="inline font-semibold">Dates:</dt> <dd class="inline">13, 14 and 15 October</dd></div>
        <div><dt class="inline font-semibold">Time:</dt> <dd class="inline">Tours will take place between 10:00 AM and 7:00 PM</dd></div>
        <div><dt class="inline font-semibold">Meeting point:</dt> <dd class="inline">Lobby of Al Salam Tower, Dubai Internet City</dd></div>
      </dl>

      <button
        type="button"
        class="mt-8 min-h-[48px] rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 sm:text-base"
        @click="openModal"
      >
        Choose the time slot
      </button>

      <img src="/img/mered-logo.svg" alt="MERED" class="mt-10 w-20 sm:absolute sm:bottom-6 sm:right-6 sm:mt-0" />
    </div>

    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="closeModal"
      >
        <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 text-gray-900 sm:p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">
              {{
                step === 'confirmation'
                  ? "You're registered!"
                  : step === 'form'
                    ? 'Your details'
                    : 'Please choose the time slot that suits you best'
              }}
            </h2>
            <button type="button" class="text-gray-400 hover:text-gray-700" @click="closeModal">✕</button>
          </div>

          <section v-if="step === 'grid'" class="mt-4">
            <div class="flex gap-2">
              <button
                v-for="date in EVENT_DATES"
                :key="date"
                type="button"
                class="min-h-[44px] flex-1 rounded-md border px-3 py-2 text-sm font-medium"
                :class="
                  selectedDate === date
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-700'
                "
                @click="selectDate(date)"
              >
                {{ dayLabel(date) }}
              </button>
            </div>

            <div class="mt-4">
              <SlotGrid :slots="slotsForSelectedDate" :selected-slot-id="selectedSlotId" @select="selectSlot" />
            </div>

            <p v-if="formError" class="mt-4 text-sm text-red-600">{{ formError }}</p>
          </section>

          <section v-else-if="step === 'form' && selectedSlot" class="mt-4">
            <p class="mb-4 text-sm text-gray-600">
              Selected slot:
              <span class="font-medium text-gray-900">
                {{ dayLabel(selectedSlot.eventDate) }},
                {{ selectedSlot.startTime.slice(0, 5) }}–{{ selectedSlot.endTime.slice(0, 5) }}
              </span>
            </p>
            <BookingForm
              :submitting="submitting"
              :form-error="formError"
              :issues="issues"
              @submit="handleSubmit"
              @back="backToGrid"
            />
          </section>

          <section v-else-if="step === 'confirmation' && confirmedSlot" class="mt-4 text-center">
            <p class="text-gray-700">
              {{ dayLabel(confirmedSlot.eventDate) }},
              {{ confirmedSlot.startTime.slice(0, 5) }}–{{ confirmedSlot.endTime.slice(0, 5) }}
            </p>
            <p class="mt-1 text-gray-700">Lobby of Al Salam Tower, Dubai Internet City</p>
            <p class="mx-auto mt-4 max-w-sm text-gray-600">
              We look forward to welcoming you and sharing this exciting milestone with you.
            </p>
            <p v-if="confirmedManageToken" class="mt-4 text-sm text-gray-600">
              Need to reschedule or cancel? Save this link:
              <br />
              <NuxtLink :to="`/booking/${confirmedManageToken}`" class="break-all font-medium text-gray-900 underline">
                {{ `/booking/${confirmedManageToken}` }}
              </NuxtLink>
            </p>
            <button
              type="button"
              class="mt-6 min-h-[48px] rounded-md bg-gray-900 px-4 py-3 text-base font-medium text-white"
              @click="closeModal"
            >
              Done
            </button>
          </section>
        </div>
      </div>
    </Teleport>
  </main>
</template>
