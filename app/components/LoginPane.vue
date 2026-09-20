<template>
  <div class="w-full bg-neutral-50 flex flex-col">
    <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">EMAIL</p>
    <input
      v-model="email"
      type="email"
      placeholder="you@example.com"
      class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white placeholder:text-neutral-500"
    >

    <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">PASSWORD</p>
    <input
      v-model="password"
      type="password"
      placeholder="••••••••"
      class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white placeholder:text-neutral-500"
    >

    <div class="mx-4 mb-4 flex flex-row gap-2">
      <button
        type="button"
        class="flex-1 tracking-wider text-sm font-medium bg-black text-white px-2 py-1 cursor-pointer"
        @click="onLogin"
      >
        LOG IN
      </button>
      <button
        type="button"
        class="flex-1 tracking-wider text-sm font-medium bg-neutral-100 text-neutral-500 px-2 py-1 cursor-pointer"
        @click="onSignUp"
      >
        SIGN UP
      </button>
    </div>

    <p v-if="error" class="tracking-wider text-sm text-red-600 px-4 pb-4">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  login: [credentials: { email: string; password: string }]
  signUp: [credentials: { email: string; password: string }]
}>()

const email = ref('')
const password = ref('')
const error = ref('')

function validate() {
  if (!email.value.trim()) {
    error.value = 'EMAIL IS REQUIRED'
    return false
  }
  if (!password.value) {
    error.value = 'PASSWORD IS REQUIRED'
    return false
  }
  error.value = ''
  return true
}

function onLogin() {
  if (!validate()) return
  emit('login', { email: email.value.trim(), password: password.value })
}

function onSignUp() {
  if (!validate()) return
  emit('signUp', { email: email.value.trim(), password: password.value })
}
</script>
