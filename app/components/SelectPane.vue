<template>
  <div class="flex-1 min-w-0 bg-neutral-100 flex flex-col text-sm">
    <p class="tracking-wider text-sm font-medium p-4 pb-[2px]">{{ label }}</p>

    <select
      :value="selected"
      class="mx-4 mb-4 px-2 py-1 tracking-wider text-sm font-medium bg-black text-white appearance-none cursor-pointer"
      @change="onChange"
    >
      <option
        v-for="(option, index) in options"
        :key="optionValues?.[index] ?? option"
        :value="optionValues?.[index] ?? option"
      >
        {{ option }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  /** Labels shown in the list. */
  options: string[]
  /**
   * Values submitted for each option, positionally matched to `options`.
   * Omit to submit the labels themselves. Needed when the real value is not
   * the label, e.g. an account id, because `<option value>` is a string.
   */
  optionValues?: string[]
  selected: string
}>()

const emit = defineEmits<{
  select: [value: string]
}>()

function onChange(event: Event) {
  emit('select', (event.target as HTMLSelectElement).value)
}
</script>