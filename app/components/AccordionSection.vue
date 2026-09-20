<template>
  <div class="w-full bg-neutral-50 flex flex-col">
    <button
      type="button"
      class="flex flex-row items-center justify-between p-4 cursor-pointer select-none"
      @click="open = !open"
    >
      <p class="tracking-wider text-sm font-medium">{{ title }}</p>
      <Icon
        name="lucide:chevron-down"
        size="16"
        class="transition-transform duration-200"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <div v-if="open" class="flex flex-col">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    title: string
    /** Whether the section starts expanded. */
    defaultOpen?: boolean
  }>(),
  {
    defaultOpen: false,
  },
)

const open = ref(false)
</script>
