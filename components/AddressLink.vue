<script setup lang="ts">
// Precise pin for Al Salam Tecom Tower, Al Sufouh, Dubai (from the client-provided Google Maps link).
const LAT = 25.101747
const LNG = 55.171039
const MAP_LINK =
  'https://www.google.com/maps/place/Al+Salam+Tecom+Tower+-+Al+Sufouh+2+-+Al+Sufouh+-+Dubai+-+United+Arab+Emirates/@25.1017518,55.1684641,12z/data=!4m6!3m5!1s0x3e5f6b7201f5475f:0x3402694e31610a53!8m2!3d25.101747!4d55.171039!16s%2Fm%2F03d0hqb'

const MIN_ZOOM = 14
const MAX_ZOOM = 20

const open = ref(false)
// The plain `output=embed` iframe has no documented params for forcing its own zoom
// control to show, so we drive zoom ourselves: changing this re-requests the iframe src.
const zoom = ref(14)
const mapEmbedSrc = computed(() => `https://www.google.com/maps?q=${LAT},${LNG}&z=${zoom.value}&output=embed`)
</script>

<template>
  <button
    type="button"
    class="underline underline-offset-2 decoration-dotted transition hover:opacity-70"
    @click="open = true"
  >
    <slot />
  </button>

  <Teleport to="body">
    <Transition name="map-modal">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
        @click.self="open = false"
      >
        <div
          class="map-modal-panel w-full max-w-4xl overflow-hidden rounded-sm border border-white/15 bg-[#141414] text-white"
        >
          <div class="flex items-center justify-between p-6">
            <p class="text-sm text-white/80">Al Salam Tower, Dubai Internet City</p>
            <button type="button" class="text-white/60 transition hover:text-white" @click="open = false">✕</button>
          </div>
          <iframe
            :src="mapEmbedSrc"
            class="h-[40vh] w-full border-0"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Al Salam Tower location"
          />
          <!-- <div class="flex items-center gap-3 border-t border-white/10 p-4">
            <span class="text-xs text-white/50">Zoom</span>
            <input
              v-model.number="zoom"
              type="range"
              :min="MIN_ZOOM"
              :max="MAX_ZOOM"
              step="1"
              class="h-1 flex-1 cursor-pointer accent-white"
            />
            <span class="w-5 text-right text-xs text-white/50">{{ zoom }}</span>
          </div> -->
          <div class="p-6">
            <a :href="MAP_LINK" target="_blank" rel="noopener" class="text-sm text-white underline">
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.map-modal-enter-active,
.map-modal-leave-active {
  transition: opacity 0.3s ease-out;
}
.map-modal-leave-active {
  transition-duration: 0.2s;
}
.map-modal-enter-from,
.map-modal-leave-to {
  opacity: 0;
}

.map-modal-enter-active .map-modal-panel,
.map-modal-leave-active .map-modal-panel {
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out;
}
.map-modal-leave-active .map-modal-panel {
  transition-duration: 0.2s;
}
.map-modal-enter-from .map-modal-panel,
.map-modal-leave-to .map-modal-panel {
  opacity: 0;
  transform: translateY(-1rem);
}
</style>
