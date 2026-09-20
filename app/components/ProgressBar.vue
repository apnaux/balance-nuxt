<template>
  <div class="w-96 h-4 relative flex flex-row items-center" :class="{'bg-red-200': isBelowThreshold}">
    <div
      class="h-full absolute transition-[width] duration-300"
      :class="isBelowThreshold ? 'bg-red-600' : 'bg-black'"
      :style="{ width: `${clampedPercent}%` }"
    />

    <div class="bg-white text-sm leading-[16px] px-0.5 ml-1 z-10">
      <p>{{ displayLabel }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Explicit percentage, 0-100. Takes precedence over value/total. */
    percent?: number
    /** Current value. Used with `total` when `percent` is omitted. */
    value?: number
    /** Maximum value. Used with `value` when `percent` is omitted. */
    total?: number
    /** Below this percentage the bar turns red. */
    threshold?: number
    /** Overrides the default `value/total` text. */
    label?: string
  }>(),
  {
    threshold: 20,
  },
)

const rawPercent = computed(() => {
  if (props.percent !== undefined) return props.percent
  if (props.value === undefined || props.total === undefined) return 0
  if (props.total === 0) return 0
  return (props.value / props.total) * 100
})

// Guard against out-of-range input so the bar never overflows its track.
const clampedPercent = computed(() => Math.min(100, Math.max(0, rawPercent.value)))

const isBelowThreshold = computed(() => clampedPercent.value <= props.threshold)

// An explicit `label` always wins. Otherwise `percent` mode shows the
// percentage itself, and `value`/`total` mode shows the raw pair.
const displayLabel = computed(() => {
  if (props.label !== undefined) return props.label
  if (props.percent !== undefined) return `${Math.round(clampedPercent.value)}%`
  return `${props.value}/${props.total}`
})
</script>
