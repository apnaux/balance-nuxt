<template>
  <div class="flex flex-col gap-2 w-96 select-none">
    <p class="tracking-wider text-sm text-center select-none">{{ title }}</p>

    <Swiper
      class="swipe-control !w-96"
      :slides-per-view="1"
      :initial-slide="RESTING_SLIDE"
      :threshold="5"
      :allow-touch-move="true"
      :simulate-touch="true"
      :touch-start-prevent-default="false"
      :prevent-clicks="false"
      :resistance-ratio="1"
      :long-swipes-ratio="0.35"
      :touch-ratio="0.5"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
    >
      <SwiperSlide>
        <div class="flex flex-row justify-end items-center p-2 w-96 bg-neutral-50 select-none">
          <p
            class="tracking-wider text-xl font-medium px-2 w-full text-right leading-[0.8] mr-2"
            :class="leftClass"
          >
            {{ leftLabel }}
          </p>
        </div>
      </SwiperSlide>

      <SwiperSlide>
        <slot />
      </SwiperSlide>

      <SwiperSlide>
        <div class="flex flex-row justify-start items-center p-2 w-96 bg-neutral-50 select-none">
          <p
            class="tracking-wider text-xl font-medium px-2 w-full leading-[0.8] ml-2"
            :class="rightClass"
          >
            {{ rightLabel }}
          </p>
        </div>
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import type { Swiper as SwiperClass } from 'swiper/types'
import 'swiper/css'

// Index of the slide the control rests on. Both neighbours exist so the user
// can swipe in either direction.
const RESTING_SLIDE = 1

const props = withDefaults(
  defineProps<{
    /** Caption above the control. */
    title: string
    /** Label revealed by swiping left-to-right. */
    leftLabel: string
    /** Label revealed by swiping right-to-left. */
    rightLabel: string
    /** Tailwind classes for the left label badge. */
    leftClass?: string
    /** Tailwind classes for the right label badge. */
    rightClass?: string
  }>(),
  {
    leftClass: 'bg-green-100 text-green-800',
    rightClass: 'bg-red-100 text-red-800',
  },
)

const emit = defineEmits<{
  left: []
  right: []
}>()

// `slideChange` also fires from Swiper's own init, when it moves to
// `initialSlide`. Ignore that first emission so it isn't read as a user swipe.
const isReady = ref(false)

// Set while our own snap-back animation runs, so the `slideChange` it emits
// isn't mistaken for a second user swipe.
let isSnappingBack = false

// A single gesture can emit `slideChange` more than once (release, then
// snap-back). Only the first emission of a gesture should fire an action.
let hasFiredThisGesture = false

function onSwiper() {
  isReady.value = true
}

function onSlideChange(swiper: SwiperClass) {
  if (!isReady.value) return
  if (isSnappingBack) return
  if (hasFiredThisGesture) return

  hasFiredThisGesture = true

  // `swipeDirection` is derived from the drag delta itself, so it stays correct
  // even though our snap-back makes `previousIndex` stale by one step.
  // `next` means the track moved left, revealing the right-hand slide.
  const direction = swiper.swipeDirection === 'next' ? 'right' : 'left'

  if (direction === 'right') {
    emit('right')
  } else {
    emit('left')
  }

  // Defer the snap-back so it never runs inside Swiper's own call stack.
  // Calling slideTo synchronously here re-enters Swiper mid-init and crashes.
  isSnappingBack = true
  nextTick(() => {
    swiper.slideTo(RESTING_SLIDE)
  })

  // Clear the flags once the snap-back animation has finished, so the next
  // real swipe is handled normally.
  swiper.once('slideChangeTransitionEnd', () => {
    isSnappingBack = false
    hasFiredThisGesture = false
  })
}
</script>
