<template>
  <div class="flex flex-row w-fit bg-neutral-50 select-none">
    <button
      v-for="tab in TABS"
      :key="tab.value"
      type="button"
      class="flex flex-col items-center gap-1 pt-3 pb-2 px-4 cursor-pointer"
      :class="model === tab.value ? 'text-black' : 'text-neutral-400'"
      @click="model = tab.value"
    >
      <Icon :name="tab.icon" size="20" />
      <span
        class="w-1 h-1 rounded-full"
        :class="model === tab.value ? 'bg-black' : 'bg-transparent'"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
const TABS = [
  { value: 'transactions', icon: 'lucide:list' },
  { value: 'accounts', icon: 'lucide:wallet' },
  { value: 'settings', icon: 'lucide:settings' },
] as const

export type Tab = (typeof TABS)[number]['value']

const model = defineModel<Tab>({ required: true })
</script>
