<template>
  <div class="flex-1 min-w-0 bg-neutral-100 flex flex-col text-sm">
    <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">{{ label }}</p>

    <select
      :value="selected"
      class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white appearance-none cursor-pointer"
      @change="onChange"
    >
      <option
        v-for="option in options"
        :key="option"
        :value="option"
      >
        {{ option }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  options: string[]
  selected: string
}>()

const emit = defineEmits<{
  select: [value: string]
}>()

function onChange(event: Event) {
  emit('select', (event.target as HTMLSelectElement).value)
}
</script>
