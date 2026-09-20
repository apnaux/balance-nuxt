<template>
  <div
    class="fixed inset-0 z-50 flex flex-row justify-center items-center bg-black/50"
    @click.self="emit('close')"
  >
    <div class="flex flex-col gap-4 bg-white p-4">
      <SwipeControl
        title="SWIPE TO EDIT OR DELETE"
        left-label="EDIT"
        right-label="DELETE"
        left-class="bg-black text-white"
        right-class="bg-red-100 text-red-800"
        @left="onEdit"
        @right="emit('delete')"
      >
        <div class="w-96 bg-neutral-50 flex flex-col p-4">
          <p class="tracking-wider text-sm font-medium">TRANSACTION DETAILS</p>
          <div
            class="flex flex-row gap-2"
            :class="transaction.isRefund ? 'text-red-600' : ''"
          >
            <p class="tracking-wider text-sm">PHP</p>
            <input
              v-model="amount"
              type="number"
              placeholder="0.00"
              class="w-full text-6xl text-right bg-neutral-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            >
          </div>
        </div>

        <div class="flex flex-row w-96">
          <SelectPane
            label="ACCOUNT"
            :options="ACCOUNTS"
            :selected="account"
            @select="account = $event"
          />

          <SelectPane
            label="CATEGORY"
            :options="CATEGORIES"
            :selected="category"
            @select="category = $event"
          />
        </div>

        <div class="w-96 bg-neutral-50 flex flex-col">
          <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">TRANSACTION DATE</p>
          <input
            v-model="date"
            type="datetime-local"
            class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white"
          >
        </div>

        <MarkdownEditor v-model="notes" />
      </SwipeControl>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MarkdownEditor from './MarkdownEditor.vue'
import SelectPane from './SelectPane.vue'
import SwipeControl from './SwipeControl.vue'

const props = defineProps<{
  transaction: {
    id: number
    account: string
    amount: number
    date: string
    isRefund?: boolean
    category?: string
    notes?: string
  }
}>()

const emit = defineEmits<{
  close: []
  save: [value: { account: string; category: string; amount: number; date: string; notes: string }]
  delete: []
}>()

const ACCOUNTS = [
  'BDO *3000',
  'BPI *1234',
  'GCASH *5678',
]

const CATEGORIES = [
  'GROCERIES',
  'TRANSPORT',
  'UTILITIES',
  'DINING',
]

const account = ref(props.transaction.account)
const category = ref(props.transaction.category ?? CATEGORIES[0] ?? '')
const notes = ref(props.transaction.notes ?? '')

// Kept as a string so the field can be cleared while typing; coerced on save.
const amount = ref(String(props.transaction.amount))

// `datetime-local` needs `YYYY-MM-DDTHH:mm`, so drop seconds and timezone.
const date = ref(props.transaction.date.slice(0, 16))

function onEdit() {
  emit('save', {
    account: account.value,
    category: category.value,
    amount: Number(amount.value) || 0,
    date: date.value,
    notes: notes.value,
  })
}
</script>
