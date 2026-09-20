<template>
  <div class="flex flex-col gap-4 w-full sm:w-[30rem] h-full min-h-0">
    <div class="w-full sm:w-[30rem] flex-1 min-h-0 bg-neutral-50 flex flex-col">
      <div class="flex flex-row items-center justify-between p-4">
        <p class="tracking-wider text-sm font-medium">ACCOUNTS</p>
        <button
          type="button"
          class="tracking-wider text-sm font-medium bg-black text-white px-2 py-1 cursor-pointer"
          @click="emit('create')"
        >
          + ADD
        </button>
      </div>

      <div class="flex flex-col flex-1 min-h-0 overflow-y-scroll">
        <p
          v-if="accounts.length === 0"
          class="tracking-wider text-sm p-4 text-neutral-500"
        >
          NO ACCOUNTS YET
        </p>

        <AccountItem
          v-for="account in accounts"
          :key="account.id"
          :account="account"
          @select="emit('select', account)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AccountItem from './AccountItem.vue'
import type { Account } from '../types'

defineProps<{
  accounts: Account[]
}>()

const emit = defineEmits<{
  create: []
  select: [account: Account]
}>()
</script>
