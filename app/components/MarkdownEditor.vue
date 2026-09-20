<template>
  <div class="flex flex-col">
    <p class="tracking-wider text-sm font-medium py-4">{{ label }}</p>

    <div class="mb-4 flex flex-col bg-neutral-100">
      <div class="flex flex-row">
        <button
          v-for="tab in TABS"
          :key="tab"
          type="button"
          class="px-2 py-1 tracking-wider text-sm font-medium"
          :class="mode === tab ? 'bg-black text-white' : 'text-neutral-500'"
          @click="mode = tab"
        >
          {{ tab }}
        </button>
      </div>

      <textarea
        v-if="mode === 'WRITE'"
        :value="modelValue"
        rows="5"
        placeholder="Write in markdown..."
        class="p-2 text-sm bg-neutral-100 resize-none outline-none"
        @input="onInput"
      />

      <div
        v-else
        class="p-2 text-sm min-h-[7.5rem] whitespace-pre-wrap"
        v-html="rendered"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const TABS = ['WRITE', 'PREVIEW'] as const

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
  }>(),
  {
    label: 'NOTES',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const mode = ref<(typeof TABS)[number]>('PREVIEW')

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Minimal markdown subset: headings, bold, italic, inline code, links, lists.
// Input is escaped first so raw HTML in the notes can't be injected.
const rendered = computed(() => {
  const lines = escapeHtml(props.modelValue).split('\n')
  const html: string[] = []
  let inList = false

  for (const line of lines) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) {
      if (!inList) {
        html.push('<ul class="list-disc pl-5">')
        inList = true
      }
      html.push(`<li>${inline(bullet[1] ?? '')}</li>`)
      continue
    }

    if (inList) {
      html.push('</ul>')
      inList = false
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    if (heading) {
      const level = heading[1]?.length ?? 1
      const sizes = ['text-lg', 'text-base', 'text-sm']
      html.push(`<p class="font-medium ${sizes[level - 1]}">${inline(heading[2] ?? '')}</p>`)
      continue
    }

    html.push(`<p>${inline(line)}</p>`)
  }

  if (inList) html.push('</ul>')
  return html.join('')
})

function inline(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-neutral-200 px-1">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a class="underline" href="$2">$1</a>')
}
</script>
