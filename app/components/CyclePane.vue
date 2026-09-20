<template>
  <div class="w-full bg-neutral-50 flex flex-col">
    <div class="flex flex-row items-center justify-between p-4 pb-[2px]">
      <p class="tracking-wider text-sm font-medium">CYCLE STARTS EVERY</p>
      <p class="tracking-wider text-sm">DAY {{ cycle.startDay }}</p>
    </div>

    <div class="flex flex-row items-center justify-between p-4 pt-[2px] pb-[2px]">
      <p class="tracking-wider text-sm font-medium">CURRENT CYCLE</p>
      <p class="tracking-wider text-sm">{{ currentRange }}</p>
    </div>

    <div class="flex flex-row items-center justify-between p-4 pt-[2px]">
      <p class="tracking-wider text-sm font-medium">NEXT CYCLE</p>
      <p class="tracking-wider text-sm">{{ nextRange }}</p>
    </div>

    <div class="flex flex-row items-center justify-between p-4 pt-[2px]">
      <p class="tracking-wider text-sm font-medium">DAYS REMAINING</p>
      <p class="tracking-wider text-sm">{{ daysRemaining }}</p>
    </div>

    <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">CHANGE START DAY</p>

    <div class="flex flex-row gap-2 mx-4 mb-4">
      <input
        v-model="draftDay"
        type="number"
        min="1"
        max="31"
        class="w-full px-2 py-1 tracking-wider text-sm font-medium bg-black text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      >
      <button
        type="button"
        class="tracking-wider text-sm font-medium bg-black text-white px-2 py-1 cursor-pointer"
        @click="onApply"
      >
        APPLY
      </button>
    </div>

    <!-- The change is deferred so the cycle in progress keeps its original
         boundaries. Applying it mid-cycle would retroactively move the dates
         the user is currently budgeting against. -->
    <p class="tracking-wider text-sm text-neutral-500 px-4 pb-4">
      TAKES EFFECT ON THE NEXT CYCLE
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Cycle } from '../types'

const props = defineProps<{
  cycle: Cycle
  /** Start of the cycle in progress, ISO date. */
  currentStart: string
  /** Start of the following cycle, ISO date. */
  nextStart: string
}>()

const emit = defineEmits<{
  change: [startDay: number]
}>()

const draftDay = ref(String(props.cycle.startDay))

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const currentRange = computed(() => `${formatDate(props.currentStart)} - ${formatDate(props.nextStart)}`)

const nextRange = computed(() => {
  const following = addMonth(props.nextStart, props.cycle.startDay)
  return `${formatDate(props.nextStart)} - ${formatDate(following)}`
})

const daysRemaining = computed(() => {
  const end = new Date(props.nextStart).getTime()
  const now = Date.now()
  return Math.max(0, Math.ceil((end - now) / 86_400_000))
})

function addMonth(iso: string, startDay: number) {
  const date = new Date(iso)
  date.setMonth(date.getMonth() + 1)
  date.setDate(startDay)
  return date.toISOString()
}

function onApply() {
  const day = Number(draftDay.value)
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    draftDay.value = String(props.cycle.startDay)
    return
  }
  emit('change', day)
}
</script>
