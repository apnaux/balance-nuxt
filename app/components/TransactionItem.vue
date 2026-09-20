<template>
  <button
    type="button"
    class="p-4 text-sm bg-neutral-100 text-left w-full cursor-pointer"
    @click="emit('select')"
  >
    <span class="flex flex-row items-center justify-between">
      <p class="tracking-wider text-sm border border-black w-fit px-1">{{ account }}</p>
      <p>{{ formattedDate }}</p>
    </span>
    <div
      class="flex flex-row gap-1 justify-end"
      :class="isRefund ? 'text-red-600' : ''"
    >
      <p class="tracking-wider text-sm pt-[2px]">PHP</p>
      <p class="text-3xl text-right bg-transparent">{{ formattedAmount }}</p>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  account: string
  amount: number
  date: string
  isRefund?: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

const formattedAmount = computed(() => props.amount.toFixed(2))

const formattedDate = computed(() =>
  new Date(props.date).toLocaleString('en-PH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }),
)
</script>
