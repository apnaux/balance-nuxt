<template>
  <SwipeControl
    title="SWIPE TO TRANSACT"
    left-label="PAY"
    right-label="REFUND"
    @left="emit('pay', amount)"
    @right="emit('refund', amount)"
  >
    <div class="w-96 bg-neutral-50 flex flex-col p-4">
      <p class="tracking-wider text-sm font-medium">TRANSACT</p>
      <div class="flex flex-row gap-2">
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
  </SwipeControl>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SelectPane from './SelectPane.vue'
import SwipeControl from './SwipeControl.vue'

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

const amount = ref('')
const account = ref(ACCOUNTS[0] ?? '')
const category = ref(CATEGORIES[0] ?? '')

const emit = defineEmits<{
  pay: [amount: string]
  refund: [amount: string]
}>()
</script>
