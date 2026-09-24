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
  }>(),
  {
    requireConsent: true,
    submitLabel: 'Register',
    firstGuestLabel: 'Your details'
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
</script>

<template>
  <form class="space-y-5" @submit.prevent="onSubmit">
    <div>
      <label for="company" class="block text-sm font-medium text-gray-700">Company / agency</label>
      <input
        id="company"
        v-model="company"
        type="text"
        required
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />
      <p v-if="issueAt(['company'])" class="mt-1 text-sm text-red-600">{{ issueAt(['company']) }}</p>
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
          <label class="block text-sm font-medium text-gray-700">First name</label>
          <input
            v-model="guest.firstName"
            type="text"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <p v-if="guestIssue(index, 'firstName')" class="mt-1 text-sm text-red-600">{{ guestIssue(index, 'firstName') }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Last name</label>
          <input
            v-model="guest.lastName"
            type="text"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <p v-if="guestIssue(index, 'lastName')" class="mt-1 text-sm text-red-600">{{ guestIssue(index, 'lastName') }}</p>
        </div>
      </div>

      <div class="mt-3">
        <label class="block text-sm font-medium text-gray-700">Phone <span class="text-gray-400">(with country code)</span></label>
        <input
          v-model="guest.phone"
          type="tel"
          placeholder="+971 50 123 4567"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <p v-if="guestIssue(index, 'phone')" class="mt-1 text-sm text-red-600">{{ guestIssue(index, 'phone') }}</p>
      </div>

      <div class="mt-3">
        <label class="block text-sm font-medium text-gray-700">Email</label>
        <input
          v-model="guest.email"
          type="email"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <p v-if="guestIssue(index, 'email')" class="mt-1 text-sm text-red-600">{{ guestIssue(index, 'email') }}</p>
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
    <p v-if="issueAt(['guests'])" class="text-sm text-red-600">{{ issueAt(['guests']) }}</p>

    <template v-if="requireConsent">
      <label class="flex items-start gap-2 text-sm text-gray-700">
        <input v-model="consent" type="checkbox" class="mt-1 h-4 w-4" />
        <span>I agree to the processing of my personal data</span>
      </label>
      <p v-if="issueAt(['consent'])" class="text-sm text-red-600">{{ issueAt(['consent']) }}</p>
    </template>

    <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

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
  </form>
</template>
