<template>
  <button
    type="button"
    class="p-4 text-sm bg-neutral-100 text-left w-full cursor-pointer"
    @click="emit('select')"
  >
    <span class="flex flex-row items-center justify-between">
      <p class="tracking-wider text-sm border border-black w-fit px-1">
        {{ account.bankShortName }} *{{ account.last4 }}
      </p>
      <p class="tracking-wider text-sm font-medium">{{ account.type.toUpperCase() }}</p>
    </span>

    <p class="tracking-wider text-sm mt-1">{{ account.bankName }}</p>

    <div v-if="account.type === 'credit'" class="flex flex-col mt-2">
      <p class="tracking-wider text-sm">CREDIT LIMIT</p>
      <div class="flex flex-row gap-1 justify-end">
        <p class="tracking-wider text-sm pt-[2px]">PHP</p>
        <p class="text-3xl text-right bg-transparent">{{ (account.creditLimit ?? 0).toFixed(2) }}</p>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { Account } from '../types'

defineProps<{
  account: Account
}>()

const emit = defineEmits<{
  select: []
}>()
</script>
