<script setup lang="ts">
interface Guest {
  firstName: string
  lastName: string
  phone: string
  email: string
}

interface Issue {
  path: (string | number)[]
  message: string
}

const props = withDefaults(
  defineProps<{
    submitting: boolean
    formError: string | null
    issues: Issue[] | null
    requireConsent?: boolean
    submitLabel?: string
    firstGuestLabel?: string
    variant?: 'light' | 'dark'
  }>(),
  {
    requireConsent: true,
    submitLabel: 'Register',
    firstGuestLabel: 'Personal details',
    variant: 'light'
  }
)

const emit = defineEmits<{
  submit: [data: { company: string; consent: boolean; guests: Guest[] }]
  back: []
}>()

const MAX_GUESTS = 10

function emptyGuest(): Guest {
  return { firstName: '', lastName: '', phone: '', email: '' }
}

const company = ref('')
const consent = ref(false)
const guests = ref<Guest[]>([emptyGuest()])

function addGuest() {
  if (guests.value.length < MAX_GUESTS) guests.value.push(emptyGuest())
}

function removeGuest(index: number) {
  if (guests.value.length > 1) guests.value.splice(index, 1)
}

function issueAt(path: (string | number)[]) {
  const key = path.join('.')
  return props.issues?.find((i) => i.path.join('.') === key)?.message
}

function guestIssue(index: number, field: keyof Guest) {
  return issueAt(['guests', index, field])
}

function onSubmit() {
  emit('submit', { company: company.value, consent: consent.value, guests: guests.value })
}

const isDark = computed(() => props.variant === 'dark')

// Light-variant styling (admin "Add booking" modal) — unchanged from before.
const labelClass = 'block text-sm font-medium text-gray-700'
const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900'
const errorClass = 'mt-1 text-sm text-red-600'

// Dark-variant (public booking modal) — floating labels: empty field shows the label
// at value size/position; on focus or once filled it floats up into a small uppercase caption.
const floatLabelClass =
  'pointer-events-none absolute left-0 -top-1 text-[11px] leading-4 font-medium uppercase tracking-wider text-white/40 transition-all duration-200 ' +
  'peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:leading-6 peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal ' +
  'peer-focus:-top-1 peer-focus:text-[11px] peer-focus:leading-4 peer-focus:font-medium peer-focus:uppercase peer-focus:tracking-wider'
const floatInputClass =
  'peer block w-full rounded-none border-0 border-b border-white/25 bg-transparent px-0 py-2 text-base text-white focus:border-white focus:outline-none focus:ring-0'
const darkErrorClass = 'mt-1 text-sm text-red-400'
</script>

<template>
  <form class="space-y-7" autocomplete="off" @submit.prevent="onSubmit">
    <template v-if="isDark">
      <div class="relative pt-1">
        <input
          id="field-x1"
          v-model="company"
          name="field-x1"
          type="text"
          required
          placeholder=" "
          autocomplete="off"
          :class="floatInputClass"
        />
        <label for="field-x1" :class="floatLabelClass">Company / Agency</label>
        <p v-if="issueAt(['company'])" :class="darkErrorClass">{{ issueAt(['company']) }}</p>
      </div>

      <div v-for="(guest, index) in guests" :key="index" class="space-y-3 pt-4">
        <div class="flex items-center justify-between pb-2">
          <h3 class="text-md text-white">{{ index === 0 ? firstGuestLabel : `Guest ${index + 1}` }}</h3>
          <button
            v-if="index > 0"
            type="button"
            class="text-sm text-white/50 underline-offset-2 hover:text-white hover:underline"
            @click="removeGuest(index)"
          >
            Remove
          </button>
        </div>

        <div class="relative pt-1">
          <input
            :id="`g${index}-x2`"
            v-model="guest.firstName"
            :name="`g${index}-x2`"
            type="text"
            required
            placeholder=" "
            autocomplete="off"
            :class="floatInputClass"
          />
          <label :for="`g${index}-x2`" :class="floatLabelClass">First name</label>
          <p v-if="guestIssue(index, 'firstName')" :class="darkErrorClass">{{ guestIssue(index, 'firstName') }}</p>
        </div>

        <div class="relative pt-1">
          <input
            :id="`g${index}-x3`"
            v-model="guest.lastName"
            :name="`g${index}-x3`"
            type="text"
            required
            placeholder=" "
            autocomplete="off"
            :class="floatInputClass"
          />
          <label :for="`g${index}-x3`" :class="floatLabelClass">Last name</label>
          <p v-if="guestIssue(index, 'lastName')" :class="darkErrorClass">{{ guestIssue(index, 'lastName') }}</p>
        </div>

        <div class="relative pt-1">
          <input
            :id="`g${index}-x4`"
            v-model="guest.phone"
            :name="`g${index}-x4`"
            type="text"
            inputmode="tel"
            required
            placeholder=" "
            autocomplete="off"
            :class="floatInputClass"
          />
          <label :for="`g${index}-x4`" :class="floatLabelClass"
            >Phone <span class="normal-case text-white/30">(with country code)</span></label
          >
          <p v-if="guestIssue(index, 'phone')" :class="darkErrorClass">{{ guestIssue(index, 'phone') }}</p>
        </div>

        <div class="relative pt-1">
          <input
            :id="`g${index}-x5`"
            v-model="guest.email"
            :name="`g${index}-x5`"
            type="text"
            inputmode="email"
            required
            placeholder=" "
            autocomplete="off"
            :class="floatInputClass"
          />
          <label :for="`g${index}-x5`" :class="floatLabelClass">Email</label>
          <p v-if="guestIssue(index, 'email')" :class="darkErrorClass">{{ guestIssue(index, 'email') }}</p>
        </div>
      </div>

      <div class="text-center">
        <button
          v-if="guests.length < MAX_GUESTS"
          type="button"
          class="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:border-white/30"
          @click="addGuest"
        >
          + Add a colleague
        </button>
      </div>
      <p v-if="issueAt(['guests'])" :class="darkErrorClass">{{ issueAt(['guests']) }}</p>

      <template v-if="requireConsent">
        <label class="flex items-center gap-2 text-sm text-white/70">
          <input v-model="consent" type="checkbox" class="mt-0 h-4 w-4 accent-white" />
          <span>I agree to the processing of my personal data</span>
        </label>
        <p v-if="issueAt(['consent'])" :class="darkErrorClass">{{ issueAt(['consent']) }}</p>
      </template>

      <p v-if="formError" :class="darkErrorClass">{{ formError }}</p>

      <div class="pt-2">
        <button
          type="submit"
          :disabled="submitting"
          class="min-h-[52px] w-full rounded-sm border border-white/30 px-4 py-4 text-base font-medium text-white transition hover:bg-white hover:text-gray-900 disabled:opacity-50"
        >
          {{ submitting ? 'Saving…' : submitLabel }}
        </button>
      </div>
    </template>

    <template v-else>
      <div>
        <label for="admin-field-x1" :class="labelClass">Company / Agency</label>
        <input
          id="admin-field-x1"
          v-model="company"
          name="admin-field-x1"
          type="text"
          required
          autocomplete="off"
          :class="inputClass"
        />
        <p v-if="issueAt(['company'])" :class="errorClass">{{ issueAt(['company']) }}</p>
      </div>

      <div v-for="(guest, index) in guests" :key="index" class="rounded-md border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">{{ index === 0 ? firstGuestLabel : `Guest ${index + 1}` }}</h3>
          <button
            v-if="index > 0"
            type="button"
            class="text-sm text-gray-400 hover:text-red-600"
            @click="removeGuest(index)"
          >
            Remove
          </button>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label :class="labelClass">First name</label>
            <input v-model="guest.firstName" type="text" required autocomplete="off" :class="inputClass" />
            <p v-if="guestIssue(index, 'firstName')" :class="errorClass">{{ guestIssue(index, 'firstName') }}</p>
          </div>
          <div>
            <label :class="labelClass">Last name</label>
            <input v-model="guest.lastName" type="text" required autocomplete="off" :class="inputClass" />
            <p v-if="guestIssue(index, 'lastName')" :class="errorClass">{{ guestIssue(index, 'lastName') }}</p>
          </div>
        </div>

        <div class="mt-3">
          <label :class="labelClass">Phone <span class="text-gray-400">(with country code)</span></label>
          <input
            v-model="guest.phone"
            type="text"
            inputmode="tel"
            placeholder="+971 50 123 4567"
            required
            autocomplete="off"
            :class="inputClass"
          />
          <p v-if="guestIssue(index, 'phone')" :class="errorClass">{{ guestIssue(index, 'phone') }}</p>
        </div>

        <div class="mt-3">
          <label :class="labelClass">Email</label>
          <input v-model="guest.email" type="text" inputmode="email" required autocomplete="off" :class="inputClass" />
          <p v-if="guestIssue(index, 'email')" :class="errorClass">{{ guestIssue(index, 'email') }}</p>
        </div>
      </div>

      <button
        v-if="guests.length < MAX_GUESTS"
        type="button"
        class="text-sm font-medium text-gray-900 underline"
        @click="addGuest"
      >
        + Add a colleague
      </button>
      <p v-if="issueAt(['guests'])" :class="errorClass">{{ issueAt(['guests']) }}</p>

      <template v-if="requireConsent">
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="consent" type="checkbox" class="mt-2 h-4 w-4" />
          <span>I agree to the processing of my personal data</span>
        </label>
        <p v-if="issueAt(['consent'])" :class="errorClass">{{ issueAt(['consent']) }}</p>
      </template>

      <p v-if="formError" :class="errorClass">{{ formError }}</p>

      <div class="flex gap-3 pt-2">
        <button
          type="button"
          class="min-h-[48px] flex-1 rounded-md border border-gray-300 px-4 py-3 text-base font-medium text-gray-700"
          @click="emit('back')"
        >
          Back
        </button>
        <button
          type="submit"
          :disabled="submitting"
          class="min-h-[48px] flex-1 rounded-md bg-gray-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50"
        >
          {{ submitting ? 'Saving…' : submitLabel }}
        </button>
      </div>
    </template>
  </form>
</template>
