<script setup lang="ts">
import { buildCalendarLinks } from '~/shared/utils/calendar'

const props = withDefaults(
  defineProps<{
    eventDate: string
    startTime: string
    endTime: string
    icsUrl: string
    variant?: 'light' | 'dark'
  }>(),
  { variant: 'light' }
)

const isDark = computed(() => props.variant === 'dark')

const open = ref(false)
const links = computed(() =>
  buildCalendarLinks({
    eventDate: props.eventDate,
    startTime: props.startTime,
    endTime: props.endTime,
    icsUrl: props.icsUrl
  })
)

const rootEl = ref<HTMLElement | null>(null)
function onClickOutside(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="rootEl" class="relative inline-block text-left">
    <button
      type="button"
      :class="
        isDark
          ? 'rounded-full border border-white/30 px-5 py-2 text-sm text-white transition hover:border-white'
          : 'text-sm font-medium text-gray-900 underline'
      "
      @click="open = !open"
    >
      + Add to calendar
    </button>

    <div
      v-if="open"
      class="absolute left-1/2 z-10 mt-2 w-52 -translate-x-1/2 overflow-hidden rounded-md border text-left text-sm shadow-lg"
      :class="isDark ? 'border-white/15 bg-[#1c1c1c] text-white' : 'border-gray-200 bg-white text-gray-900'"
    >
      <a
        :href="links.google"
        target="_blank"
        rel="noopener"
        class="block px-4 py-2 transition"
        :class="isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50'"
        @click="open = false"
      >
        Google Calendar
      </a>
      <a
        :href="links.outlook"
        target="_blank"
        rel="noopener"
        class="block px-4 py-2 transition"
        :class="isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50'"
        @click="open = false"
      >
        Outlook
      </a>
      <a
        :href="links.apple"
        class="block px-4 py-2 transition"
        :class="isDark ? 'hover:bg-white/10' : 'hover:bg-gray-50'"
        @click="open = false"
      >
        Apple / Other (.ics)
      </a>
    </div>
  </div>
</template>
