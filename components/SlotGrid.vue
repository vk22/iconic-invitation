<script setup lang="ts">
import type { SlotDto } from '~/composables/useEventSlots'

defineProps<{
  slots: SlotDto[]
  selectedSlotId: string | null
}>()

const emit = defineEmits<{ select: [slotId: string] }>()

function formatRange(slot: SlotDto) {
  return `${slot.startTime.slice(0, 5)}–${slot.endTime.slice(0, 5)}`
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
    <button
      v-for="slot in slots"
      :key="slot.id"
      type="button"
      :disabled="slot.remaining <= 0"
      class="min-h-[72px] rounded-lg border px-3 py-3 text-left transition"
      :class="[
        slot.remaining <= 0
          ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
          : selectedSlotId === slot.id
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 bg-white hover:border-gray-900'
      ]"
      @click="emit('select', slot.id)"
    >
      <div class="font-medium">{{ formatRange(slot) }}</div>
      <div class="mt-1 text-sm" :class="selectedSlotId === slot.id ? 'text-gray-200' : 'text-gray-500'">
        {{ slot.remaining <= 0 ? 'No spots left' : `${slot.remaining} of ${slot.capacity} left` }}
      </div>
    </button>
  </div>
</template>
