<template>
  <div class="w-full sm:w-[30rem] flex-1 min-h-0 bg-neutral-50 flex flex-col">
    <div class="flex flex-row items-center justify-between p-4">
      <p class="tracking-wider text-sm font-medium">RECURRING</p>
      <div class="flex flex-row gap-2">
        <button
          type="button"
          class="tracking-wider text-sm px-2 py-1 border border-black cursor-pointer"
          @click="showInactive = !showInactive"
        >
          {{ showInactive ? 'HIDE INACTIVE' : 'SHOW INACTIVE' }}
        </button>
        <button
          type="button"
          class="tracking-wider text-sm font-medium bg-black text-white px-2 py-1 cursor-pointer"
          @click="emit('create')"
        >
          + ADD
        </button>
      </div>
    </div>

    <div class="flex flex-col flex-1 min-h-0 overflow-y-scroll gap-1">
      <RecurringItem
        v-for="item in visible"
        :key="item.id"
        :item="item"
        :accounts="accounts"
        :transactions="transactions"
        :cycle-start="cycleStart"
        @edit="emit('edit', item)"
        @pay="emit('pay', item)"
      />

      <p
        v-if="visible.length === 0"
        class="p-4 tracking-wider text-sm text-neutral-500"
      >
        {{ showInactive ? 'NO RECURRING TRANSACTIONS' : 'NO ACTIVE RECURRING TRANSACTIONS' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import RecurringItem from './RecurringItem.vue'
import type { Account, RecurringTransaction, Transaction } from '../types'

const props = defineProps<{
  items: RecurringTransaction[]
  accounts: Account[]
  transactions: Transaction[]
  cycleStart: string
}>()

const emit = defineEmits<{
  create: []
  edit: [item: RecurringTransaction]
  pay: [item: RecurringTransaction]
}>()

// Paused items are hidden by default; they stay addressable through the toggle.
const showInactive = ref(false)

const visible = computed(() =>
  showInactive.value ? props.items : props.items.filter(i => i.active),
)
</script>