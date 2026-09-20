<template>
  <Swiper
    class="tab-swiper !w-full sm:!w-[30rem] flex-1 min-h-0"
    :slides-per-view="1"
    :initial-slide="initialIndex"
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
    <SwiperSlide v-for="name in TAB_ORDER" :key="name">
      <slot :name="name" />
    </SwiperSlide>
  </Swiper>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import type { Swiper as SwiperClass } from 'swiper/types'
import 'swiper/css'
import { TAB_ORDER, type Tab } from '../tabs'

const model = defineModel<Tab>({ required: true })

const initialIndex = TAB_ORDER.indexOf(model.value)

let swiperRef: SwiperClass | null = null

// `slideChange` fires from Swiper's own init and from programmatic `slideTo`,
// not only from user gestures. Only a gesture should write back to the model.
let isSyncing = false

function onSwiper(swiper: SwiperClass) {
  swiperRef = swiper
}

function onSlideChange(swiper: SwiperClass) {
  if (isSyncing) return

  const next = TAB_ORDER[swiper.activeIndex]
  if (next !== undefined) model.value = next
}

// Keep the swiper in step when the tab changes from the TabSwitcher buttons.
watch(model, (value) => {
  const index = TAB_ORDER.indexOf(value)
  if (index === -1 || !swiperRef) return
  if (swiperRef.activeIndex === index) return

  isSyncing = true
  nextTick(() => {
    swiperRef?.slideTo(index)
  })
  swiperRef.once('slideChangeTransitionEnd', () => {
    isSyncing = false
  })
})
</script>
