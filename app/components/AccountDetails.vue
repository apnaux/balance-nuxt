<template>
  <div
    class="fixed inset-0 z-50 flex flex-row justify-center items-center bg-black/50"
    @click.self="emit('close')"
  >
    <div class="flex flex-col gap-4 bg-white p-4 w-full sm:w-auto max-h-[90svh] overflow-y-auto">
      <SwipeControl
        title="SWIPE TO SAVE OR DELETE"
        left-label="SAVE"
        right-label="DELETE"
        left-class="bg-black text-white"
        right-class="bg-red-100 text-red-800"
        @left="onSave"
        @right="emit('delete')"
      >
        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col p-4">
          <p class="tracking-wider text-sm font-medium">ACCOUNT DETAILS</p>
          <p class="tracking-wider text-sm mt-1">
            {{ account ? `${account.bankShortName} *${account.last4}` : 'NEW ACCOUNT' }}
          </p>
        </div>

        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col">
          <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">BANK NAME</p>
          <input
            v-model="bankName"
            type="text"
            placeholder="BANCO DE ORO"
            class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white placeholder:text-neutral-500"
          >
        </div>

        <div class="flex flex-row w-full sm:w-[30rem]">
          <div class="flex-1 min-w-0 bg-neutral-100 flex flex-col text-sm">
            <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">SHORT NAME</p>
            <input
              v-model="bankShortName"
              type="text"
              placeholder="BDO"
              class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white placeholder:text-neutral-500"
            >
          </div>

          <div class="flex-1 min-w-0 bg-neutral-100 flex flex-col text-sm">
            <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">LAST 4 DIGITS</p>
            <input
              v-model="last4"
              type="text"
              inputmode="numeric"
              maxlength="4"
              placeholder="0000"
              class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white placeholder:text-neutral-500"
            >
          </div>
        </div>

        <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col">
          <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">ACCOUNT TYPE</p>

          <!-- Type is fixed once the account exists: switching credit to debit
               would orphan the credit-only fields below. -->
          <p
            v-if="account"
            class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-neutral-200 text-neutral-500"
          >
            {{ type.toUpperCase() }}
          </p>

          <div v-else class="flex flex-row gap-2 mx-4 mb-4">
            <button
              v-for="option in TYPES"
              :key="option.value"
              type="button"
              class="flex-1 px-2 py-1 tracking-wider text-sm font-medium cursor-pointer"
              :class="type === option.value ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500'"
              @click="type = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <template v-if="type === 'credit'">
          <div class="flex flex-row w-full sm:w-[30rem]">
            <div class="flex-1 min-w-0 bg-neutral-100 flex flex-col text-sm">
              <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">STATEMENT DAY</p>
              <input
                v-model="statementDay"
                type="number"
                min="1"
                max="31"
                placeholder="15"
                class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white placeholder:text-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              >
            </div>

            <div class="flex-1 min-w-0 bg-neutral-100 flex flex-col text-sm">
              <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">DUE AFTER (DAYS)</p>
              <input
                v-model="paymentDueDays"
                type="number"
                min="0"
                placeholder="20"
                class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white placeholder:text-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              >
            </div>
          </div>

          <div class="w-full sm:w-[30rem] bg-neutral-50 flex flex-col">
            <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">CREDIT LIMIT</p>
            <div class="flex flex-row gap-2 mx-4 mb-4">
              <p class="tracking-wider text-sm pt-[6px]">PHP</p>
              <input
                v-model="creditLimit"
                type="number"
                placeholder="0.00"
                class="w-full px-2 py-1 text-3xl text-right tracking-wider font-medium bg-black text-white placeholder:text-neutral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              >
            </div>
          </div>
        </template>
      </SwipeControl>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SwipeControl from './SwipeControl.vue'
import type { Account, AccountType } from '../types'

const props = defineProps<{
  /** Omitted when creating a new account. */
  account?: Account
}>()

const emit = defineEmits<{
  close: []
  save: [value: Omit<Account, 'id'>]
  delete: []
}>()

const TYPES: { value: AccountType; label: string }[] = [
  { value: 'debit', label: 'DEBIT' },
  { value: 'credit', label: 'CREDIT' },
]

const bankName = ref(props.account?.bankName ?? '')
const bankShortName = ref(props.account?.bankShortName ?? '')
const last4 = ref(props.account?.last4 ?? '')

// Existing accounts keep their type; only a new account can choose one.
const type = ref<AccountType>(props.account?.type ?? 'debit')

// Kept as strings so the fields can be cleared while typing; coerced on save.
const statementDay = ref(String(props.account?.statementDay ?? ''))
const paymentDueDays = ref(String(props.account?.paymentDueDays ?? ''))
const creditLimit = ref(String(props.account?.creditLimit ?? ''))

function onSave() {
  const isCredit = type.value === 'credit'

  emit('save', {
    bankName: bankName.value,
    bankShortName: bankShortName.value,
    last4: last4.value,
    type: type.value,
    // Credit-only fields are dropped when switching back to debit, so a
    // converted account doesn't keep stale credit data.
    statementDay: isCredit ? Number(statementDay.value) || undefined : undefined,
    paymentDueDays: isCredit ? Number(paymentDueDays.value) || undefined : undefined,
    creditLimit: isCredit ? Number(creditLimit.value) || undefined : undefined,
  })
}
</script>
