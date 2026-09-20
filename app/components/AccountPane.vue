<template>
  <div class="w-full bg-neutral-50 flex flex-col">
    <div class="flex flex-row items-center justify-between p-4 pb-[2px]">
      <p class="tracking-wider text-sm font-medium">EMAIL</p>
      <p class="tracking-wider text-sm">{{ user.email }}</p>
    </div>

    <div class="flex flex-row items-center justify-between p-4 pt-[2px]">
      <p class="tracking-wider text-sm font-medium">MEMBER SINCE</p>
      <p class="tracking-wider text-sm">{{ memberSince }}</p>
    </div>

    <button
      type="button"
      class="mx-4 mb-4 tracking-wider text-sm font-medium bg-neutral-100 text-neutral-500 px-2 py-1 cursor-pointer"
      @click="emit('logout')"
    >
      LOG OUT
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  user: { email: string; createdAt: string }
}>()

const emit = defineEmits<{
  logout: []
}>()

const memberSince = computed(() =>
  new Date(props.user.createdAt).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }),
)
</script>
