<script setup lang="ts">
import type { SlotDto } from "~/composables/useEventSlots";

const EVENT_DATES = ["2026-10-13", "2026-10-14", "2026-10-15"];

function dayLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

const { slots, refreshSlots } = useEventSlots();

// Staged entrance on first load: background is visible immediately (no gate needed),
// then top logo / rest of the content / bottom logo fade+slide in one after another.
const showTopLogo = ref(false);
const showContent = ref(false);
const showBottomLogo = ref(false);

onMounted(() => {
  setTimeout(() => {
    showTopLogo.value = true;
  }, 300);
  setTimeout(() => {
    showContent.value = true;
  }, 400);
  setTimeout(() => {
    showBottomLogo.value = true;
  }, 500);
});

const modalOpen = ref(false);
const selectedDate = ref(EVENT_DATES[0]);
const selectedSlotId = ref<string | null>(null);
const step = ref<"grid" | "form" | "confirmation">("grid");

const submitting = ref(false);
const formError = ref<string | null>(null);
const issues = ref<{ path: (string | number)[]; message: string }[] | null>(
  null,
);

const confirmedSlot = ref<{
  eventDate: string;
  startTime: string;
  endTime: string;
} | null>(null);
const confirmedManageToken = ref<string | null>(null);

const slotsForSelectedDate = computed<SlotDto[]>(() =>
  (slots.value ?? []).filter((s) => s.eventDate === selectedDate.value),
);

const selectedSlot = computed(
  () => (slots.value ?? []).find((s) => s.id === selectedSlotId.value) ?? null,
);

function openModal() {
  modalOpen.value = true;
}

function closeModal() {
  if (submitting.value) return;
  modalOpen.value = false;
  step.value = "grid";
  selectedSlotId.value = null;
  confirmedSlot.value = null;
  confirmedManageToken.value = null;
  formError.value = null;
  issues.value = null;
}

function selectDate(date: string) {
  selectedDate.value = date;
  selectedSlotId.value = null;
}

function selectSlot(slotId: string) {
  selectedSlotId.value = slotId;
  step.value = "form";
  formError.value = null;
  issues.value = null;
}

function backToGrid() {
  step.value = "grid";
  formError.value = null;
  issues.value = null;
}

interface GuestData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

async function handleSubmit(data: {
  company: string;
  consent: boolean;
  guests: GuestData[];
}) {
  if (!selectedSlot.value) return;

  formError.value = null;
  issues.value = null;

  await refreshSlots();
  const freshSlot = (slots.value ?? []).find(
    (s) => s.id === selectedSlot.value?.id,
  );
  if (!freshSlot || freshSlot.remaining < data.guests.length) {
    formError.value =
      "This slot no longer has enough spots for your group — please choose another one.";
    step.value = "grid";
    selectedSlotId.value = null;
    return;
  }

  submitting.value = true;
  try {
    const res = await $fetch("/api/bookings", {
      method: "POST",
      body: { slotId: selectedSlot.value.id, ...data },
    });
    confirmedSlot.value = res.slot;
    confirmedManageToken.value = res.manageToken;
    step.value = "confirmation";
  } catch (err: any) {
    const status = err?.data?.statusCode ?? err?.statusCode;
    const payload = err?.data?.data;

    if (status === 400 && payload?.issues) {
      issues.value = payload.issues;
    } else if (status === 409 && payload?.existingSlot) {
      const s = payload.existingSlot;
      formError.value = `One of these phone numbers is already registered for ${dayLabel(s.eventDate)}, ${s.startTime.slice(0, 5)}–${s.endTime.slice(0, 5)}.`;
    } else if (status === 409) {
      formError.value =
        "This slot no longer has enough spots for your group — please choose another one.";
      await refreshSlots();
      step.value = "grid";
      selectedSlotId.value = null;
    } else if (status === 429) {
      formError.value =
        "Too many attempts — please wait a few minutes and try again.";
    } else {
      formError.value = "Something went wrong. Please try again.";
    }
  } finally {
    submitting.value = false;
    await refreshSlots();
  }
}
</script>

<template>
  <main class="relative min-h-screen">
    <div class="fixed inset-0 -z-10">
      <img src="/img/main-img.jpg" alt="" class="h-full w-full object-cover" />
      <div
        class="absolute inset-0 bg-gradient-to-b from-black/55 via-black/75 to-black/75"
      />
    </div>

    <div
      class="relative flex min-h-screen flex-col items-center px-4 pt-10 pb-28 text-center text-white sm:py-14"
    >
      <Transition name="entrance">
        <img
          v-if="showTopLogo"
          src="/img/iconic-logo.svg"
          alt="ICONIC Residences, design by Pininfarina"
          class="w-[150px] sm:w-[220px]"
        />
      </Transition>

      <Transition name="entrance">
      <div v-if="showContent" class="flex w-full flex-col items-center">
      <h1 class="mt-10 sm:mt-20 max-w-2xl font-serif text-3xl leading-tight sm:text-5xl xl:text-6xl">
        <span class="main-title-sans uppercase">You're Invited to</span><br />
        <span class="main-title-sans uppercase tracking-wide"
          >ICONIC Residences'</span
        ><br />
        <span class="main-title-sans-bold uppercase">First in Place Reveal</span>
      </h1>

      <div
        class="mt-8 sm:mt-14 grid max-w-4xl gap-x-8 gap-y-4 text-sm text-white/90 sm:grid-cols-2 sm:text-base text-left"
      >
        <p>
          Join us for the exclusive reveal of the First in Place apartment at
          ICONIC Residences, designed by Pininfarina—the first completed home
          within this landmark development.
        </p>
        <p>
          In an intimate group of guests, you will be among the first to step
          inside the apartment, admire the views, capture photos and videos, and
          discover a few special surprises along the way.
        </p>
        <p>
          Your experience will begin in the lobby of Al Salam Tower, Dubai
          Internet City, where our team will welcome you before accompanying you
          to the construction site.
        </p>
        <p>
          After the tour, we would be delighted to host you for refreshments and
          light bites.
        </p>
      </div>

      <div class="w-full max-w-4xl flex justify-center mt-8 sm:mt-14 ">
        <dl
          class="flex w-full space-x-0 rounded-sm text-left text-sm sm:text-base"
        >
          <div class="flex flex-col items-center gap-4 basis-1/3 border border-white/10 border-dashed p-2 sm:p-8">
            <dt class="flex items-center gap-2 font-semibold">
              <svg viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1" class="h-5 w-5 shrink-0">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
              Dates
            </dt>
            <dd class="text-center">13, 14 and 15 October</dd>
          </div>
          <div class="flex flex-col items-center gap-4 basis-1/3 border border-white/10 border-dashed p-2 sm:p-8">
            <dt class="flex items-center gap-2 font-semibold">
              <svg viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1" class="h-5 w-5 shrink-0">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              Time
            </dt>
            <dd class="text-center">
              Tours will take place between<br>10:00 AM and 7:00 PM
            </dd>
          </div>
          <div class="flex flex-col items-center gap-4 basis-1/3 border border-white/10 border-dashed p-2 sm:p-8">
            <dt class="flex items-center gap-2 font-semibold">
              <svg viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1" class="h-5 w-5 shrink-0">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
              Meeting point
            </dt>
            <dd class="flex text-center">
              
              <AddressLink>Lobby of Al Salam Tower,<br>Dubai Internet City</AddressLink>
            </dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        class="fixed inset-x-4 bottom-4 z-40 min-h-[52px] rounded-sm bg-white px-10 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-gray-900 shadow-lg transition hover:bg-white/90 sm:static sm:inset-auto sm:z-auto sm:mt-20 sm:w-[545px] sm:shadow-none sm:text-base"
        @click="openModal"
      >
        Choose the time slot
      </button>
      </div>
      </Transition>

      <Transition name="entrance">
        <img
          v-if="showBottomLogo"
          src="/img/mered-logo.svg"
          alt="MERED"
          class="mt-10 w-[150px] sm:absolute sm:bottom-6 sm:right-6 sm:mt-0"
        />
      </Transition>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="modalOpen"
          class="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 p-0"
          @click.self="closeModal"
        >
          <div
            class="modal-panel max-h-[100vh] sm:max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-sm border border-white/15 bg-[#141414] p-2 text-white sm:p-6"
          >
          <div class="flex items-center justify-between p-2 sm:p-0">
            <button
              v-if="step === 'form'"
              type="button"
              class="text-sm text-white/60 transition hover:text-white"
              @click="backToGrid"
            >
              ← Back
            </button>
            <span v-else />
            <button
              type="button"
              class="text-white/60 transition hover:text-white"
              @click="closeModal"
            >
              ✕
            </button>
          </div>

          <div class="px-2 sm:px-8 py-3 sm:py-6 ">
            <Transition name="step" mode="out-in">
            <div :key="step">
            <div class="mt-2 text-center">
              <template v-if="step === 'grid'">
                <h2 class="title-sans text-3xl sm:text-4xl">
                  Choose the time slot
                </h2>
                <p class="title-sans-italic text-3xl sm:text-4xl text-white/90">
                  that suits you best
                </p>
              </template>
              <template v-else-if="step === 'form'">
                <h2 class="title-sans text-3xl sm:text-4xl mt-6">
                  Your details
                </h2>
                <p v-if="selectedSlot" class="mt-8 text-md text-white/70">
                  <span class="font-semibold text-white">Selected slot:</span>
                  {{ dayLabel(selectedSlot.eventDate) }},
                  {{ selectedSlot.startTime.slice(0, 5) }}–{{
                    selectedSlot.endTime.slice(0, 5)
                  }}
                </p>
              </template>
              <template v-else-if="step === 'confirmation'">
                <h2 class="text-3xl sm:text-4xl pb-2 sm:pb-5">
                  You're registered!
                </h2>
              </template>
            </div>

            <section v-if="step === 'grid'" class="mt-6">
              <div class="flex gap-2">
                <button
                  v-for="date in EVENT_DATES"
                  :key="date"
                  type="button"
                  class="min-h-[44px] flex-1 rounded-sm border px-5 py-5 text-md font-medium transition"
                  :class="
                    selectedDate === date
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-white/20 text-white/70 hover:border-white/50'
                  "
                  @click="selectDate(date)"
                >
                  {{ dayLabel(date) }}
                </button>
              </div>

              <div class="mt-4">
                <SlotGrid
                  :slots="slotsForSelectedDate"
                  :selected-slot-id="selectedSlotId"
                  variant="dark"
                  @select="selectSlot"
                />
              </div>

              <p v-if="formError" class="mt-4 text-sm text-red-400">
                {{ formError }}
              </p>
            </section>

            <section v-else-if="step === 'form' && selectedSlot" class="mt-6">
              <BookingForm
                :submitting="submitting"
                :form-error="formError"
                :issues="issues"
                variant="dark"
                @submit="handleSubmit"
                @back="backToGrid"
              />
            </section>

            <section
              v-else-if="step === 'confirmation' && confirmedSlot"
              class="mt-4 text-center"
            >
              <p class="text-white/80">
                {{ dayLabel(confirmedSlot.eventDate) }},
                {{ confirmedSlot.startTime.slice(0, 5) }}–{{
                  confirmedSlot.endTime.slice(0, 5)
                }}
              </p>
              <p class="mt-1 text-white/80">
                Lobby of <AddressLink>Al Salam Tower, Dubai Internet City</AddressLink>
              </p>
              <p class="mx-auto mt-4 max-w-sm text-white/60">
                We look forward to welcoming you and sharing this exciting
                milestone with you.
              </p>
              <div v-if="confirmedManageToken" class="mt-6">
                <AddToCalendarMenu
                  :event-date="confirmedSlot.eventDate"
                  :start-time="confirmedSlot.startTime"
                  :end-time="confirmedSlot.endTime"
                  :ics-url="`/api/bookings/${confirmedManageToken}/calendar.ics`"
                  variant="dark"
                />
              </div>
              <p v-if="confirmedManageToken" class="mt-4 text-sm text-white/60">
                Need to reschedule or cancel? Save this link:
                <br />
                <NuxtLink
                  :to="`/booking/${confirmedManageToken}`"
                  class="break-all font-medium text-white underline"
                >
                  {{ `/booking/${confirmedManageToken}` }}
                </NuxtLink>
              </p>
              <button
                type="button"
                class="mt-6 min-h-[52px] w-full rounded-sm border border-white/50 px-4 py-3 text-base font-medium text-white transition hover:bg-white hover:text-gray-900"
                @click="closeModal"
              >
                Done
              </button>
            </section>
            </div>
            </Transition>
          </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease-out;
}
.modal-leave-active {
  transition-duration: 0.2s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out;
}
.modal-leave-active .modal-panel {
  transition-duration: 0.2s;
}
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(-1rem);
}

.step-enter-active {
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out;
}
.step-leave-active {
  transition: opacity 0.15s ease-in;
}
.step-enter-from {
  opacity: 0;
  transform: translateY(-1rem);
}
.step-leave-to {
  opacity: 0;
}

.entrance-enter-active {
  transition:
    opacity 2s ease-out,
    transform 0.3s ease-out;
}
.entrance-enter-from {
  opacity: 0;
  transform: translateY(0.25rem);
}
</style>
