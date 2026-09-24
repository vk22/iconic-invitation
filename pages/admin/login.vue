<script setup lang="ts">
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

async function onSubmit() {
  error.value = null
  submitting.value = true
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    await navigateTo('/admin')
  } catch {
    error.value = 'Неверный пароль'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-sm px-4 py-16">
    <h1 class="text-2xl font-semibold">Login</h1>
    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autofocus
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-base focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button
        type="submit"
        :disabled="submitting"
        class="min-h-[48px] w-full rounded-md bg-gray-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50"
      >
        {{ submitting ? 'Вход…' : 'Войти' }}
      </button>
    </form>
  </main>
</template>
