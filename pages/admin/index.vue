<script setup lang="ts">
interface BookingRow {
  id: string
  company: string
  guestCount: number
  status: string
  createdByAdmin: boolean
  createdAt: string
  slotId: string
  eventDate: string
  startTime: string
  endTime: string
  guests: { firstName: string; lastName: string; phone: string; email: string }[]
}

const EVENT_DATES = ['2026-10-13', '2026-10-14', '2026-10-15']

const { slots, refreshSlots } = useEventSlots()

const dateFilter = ref('')
const slotFilter = ref('')

const slotsForFilter = computed(() => (slots.value ?? []).filter((s) => !dateFilter.value || s.eventDate === dateFilter.value))

watch(dateFilter, () => {
  slotFilter.value = ''
})

const query = computed(() => ({
  ...(dateFilter.value ? { date: dateFilter.value } : {}),
  ...(slotFilter.value ? { slotId: slotFilter.value } : {})
}))

const {
  data: bookings,
  refresh: refreshBookings,
  error
} = await useFetch<BookingRow[]>('/api/admin/bookings', { query })

watchEffect(() => {
  if (error.value && (error.value as any).statusCode === 401) {
    navigateTo('/admin/login')
  }
})

function formatSlot(row: BookingRow) {
  return `${row.eventDate} ${row.startTime.slice(0, 5)}–${row.endTime.slice(0, 5)}`
}

function formatCreatedAt(value: string) {
  return new Date(value).toLocaleString('en-GB')
}

function guestNames(row: BookingRow) {
  return row.guests.map((g) => `${g.firstName} ${g.lastName}`).join(', ')
}

const cancellingId = ref<string | null>(null)

async function cancelBooking(id: string) {
  if (!confirm('Cancel this booking?')) return
  cancellingId.value = id
  try {
    await $fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' })
    await Promise.all([refreshBookings(), refreshSlots()])
  } finally {
    cancellingId.value = null
  }
}

const exportUrl = computed(() => {
  const params = new URLSearchParams(query.value as Record<string, string>)
  const qs = params.toString()
  return `/api/admin/export.csv${qs ? `?${qs}` : ''}`
})

// Manual add
const addModalOpen = ref(false)
const addSlotId = ref<string | null>(null)
const addSubmitting = ref(false)
const addFormError = ref<string | null>(null)
const addIssues = ref<{ path: (string | number)[]; message: string }[] | null>(null)
const addDate = ref(EVENT_DATES[0])

const slotsForAddDate = computed(() => (slots.value ?? []).filter((s) => s.eventDate === addDate.value))
const addSelectedSlot = computed(() => (slots.value ?? []).find((s) => s.id === addSlotId.value) ?? null)

function selectAddDate(date: string) {
  addDate.value = date
  addSlotId.value = null
}

function openAddModal() {
  addModalOpen.value = true
  addSlotId.value = null
  addFormError.value = null
  addIssues.value = null
}

function closeAddModal() {
  if (addSubmitting.value) return
  addModalOpen.value = false
}

async function handleAddBooking(data: { company: string; guests: any[] }) {
  if (!addSlotId.value) {
    addFormError.value = 'Please choose a slot first.'
    return
  }

  addSubmitting.value = true
  addFormError.value = null
  addIssues.value = null
  try {
    await $fetch('/api/admin/bookings', {
      method: 'POST',
      body: { slotId: addSlotId.value, company: data.company, guests: data.guests }
    })
    addModalOpen.value = false
    await Promise.all([refreshBookings(), refreshSlots()])
  } catch (err: any) {
    const status = err?.data?.statusCode ?? err?.statusCode
    const payload = err?.data?.data
    if (status === 400 && payload?.issues) {
      addIssues.value = payload.issues
    } else {
      addFormError.value = err?.data?.statusMessage ?? 'Something went wrong.'
    }
  } finally {
    addSubmitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Bookings</h1>
      <button
        type="button"
        class="min-h-[40px] rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        @click="openAddModal"
      >
        + Add booking
      </button>
    </div>

    <section class="mt-4 rounded-lg border border-gray-200 p-3">
      <h2 class="text-sm font-medium text-gray-700">Slot summary</h2>
      <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-9">
        <div
          v-for="slot in slotsForFilter"
          :key="slot.id"
          class="rounded border border-gray-200 px-2 py-1 text-center text-xs"
          :class="{ 'border-red-300 bg-red-50': slot.capacity - slot.remaining > slot.capacity }"
        >
          <div>{{ slot.startTime.slice(0, 5) }}</div>
          <div class="font-medium">{{ slot.capacity - slot.remaining }}/{{ slot.capacity }}</div>
        </div>
      </div>
    </section>

    <!-- <div class="mt-4 flex flex-wrap items-end gap-3">
      <div>
        <label class="block text-sm font-medium text-gray-700">Day</label>
        <select v-model="dateFilter" class="mt-1 rounded-md border border-gray-300 px-3 py-2">
          <option value="">All days</option>
          <option v-for="date in EVENT_DATES" :key="date" :value="date">{{ date }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Slot</label>
        <select v-model="slotFilter" class="mt-1 rounded-md border border-gray-300 px-3 py-2">
          <option value="">All slots</option>
          <option v-for="slot in slotsForFilter" :key="slot.id" :value="slot.id">
            {{ slot.startTime.slice(0, 5) }}–{{ slot.endTime.slice(0, 5) }}
          </option>
        </select>
      </div>
      <a
        :href="exportUrl"
        class="ml-auto min-h-[40px] rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
      >
        Export CSV
      </a>
    </div> -->

    <div class="mt-4 overflow-x-auto">
      <table class="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left text-gray-500">
            <th class="py-2 pr-3">Company</th>
            <th class="py-2 pr-3">Guests</th>
            <th class="py-2 pr-3">Size</th>
            <th class="py-2 pr-3">Slot</th>
            <th class="py-2 pr-3">Created</th>
            <th class="py-2 pr-3">Status</th>
            <th class="py-2 pr-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in bookings ?? []" :key="row.id" class="border-b border-gray-100">
            <td class="py-2 pr-3">{{ row.company }}</td>
            <td class="py-2 pr-3">{{ guestNames(row) }}</td>
            <td class="py-2 pr-3">{{ row.guestCount }}{{ row.createdByAdmin ? ' (admin)' : '' }}</td>
            <td class="py-2 pr-3">{{ formatSlot(row) }}</td>
            <td class="py-2 pr-3">{{ formatCreatedAt(row.createdAt) }}</td>
            <td class="py-2 pr-3">{{ row.status }}</td>
            <td class="py-2 pr-3">
              <button
                v-if="row.status === 'confirmed'"
                type="button"
                :disabled="cancellingId === row.id"
                class="text-red-600 hover:underline disabled:opacity-50"
                @click="cancelBooking(row.id)"
              >
                Cancel
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!bookings?.length" class="py-6 text-center text-gray-500">No bookings</p>
    </div>

    <Teleport to="body">
      <div
        v-if="addModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="closeAddModal"
      >
        <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 text-gray-900 sm:p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Add booking</h2>
            <button type="button" class="text-gray-400 hover:text-gray-700" @click="closeAddModal">✕</button>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700">Day</label>
            <div class="mt-1 flex gap-2">
              <button
                v-for="date in EVENT_DATES"
                :key="date"
                type="button"
                class="min-h-[40px] flex-1 rounded-md border px-2 py-2 text-sm font-medium"
                :class="
                  addDate === date ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700'
                "
                @click="selectAddDate(date)"
              >
                {{ date }}
              </button>
            </div>

            <div class="mt-3">
              <SlotGrid :slots="slotsForAddDate" :selected-slot-id="addSlotId" @select="(id) => (addSlotId = id)" />
            </div>
            <p v-if="addSelectedSlot && addSelectedSlot.remaining <= 0" class="mt-2 text-sm text-amber-600">
              This slot is already full — adding here will exceed its capacity.
            </p>
          </div>

          <div class="mt-4">
            <BookingForm
              :submitting="addSubmitting"
              :form-error="addFormError"
              :issues="addIssues"
              :require-consent="false"
              submit-label="Add booking"
              first-guest-label="Guest 1"
              @submit="handleAddBooking"
              @back="closeAddModal"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>
