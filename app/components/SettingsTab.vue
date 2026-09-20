<template>
  <div class="flex flex-col gap-4 w-full sm:w-[30rem] h-full min-h-0">
    <div class="w-full sm:w-[30rem] flex-1 min-h-0 bg-neutral-50 flex flex-col">
      <div class="flex flex-row items-center justify-between p-4">
        <p class="tracking-wider text-sm font-medium">SETTINGS</p>
      </div>

      <div class="flex flex-col flex-1 min-h-0 overflow-y-scroll">
        <AccordionSection title="ACCOUNT DETAILS">
          <AccountPane
            v-if="user"
            :user="user"
            @logout="emit('logout')"
          />
          <LoginPane
            v-else
            @login="emit('login', $event)"
            @sign-up="emit('signUp', $event)"
          />
        </AccordionSection>

        <AccordionSection title="BUDGETS">
          <BudgetsPane
            :budget="budget"
            :cycle-key="cycleKey"
            :cycle-label="cycleLabel"
            @set-permanent="emit('setBudgetPermanent', $event)"
            @set-temporary="emit('setBudgetTemporary', $event)"
            @clear-temporary="emit('clearBudgetTemporary')"
          />
        </AccordionSection>

        <AccordionSection title="CYCLE">
          <CyclePane
            :cycle="cycle"
            :current-start="currentStart"
            :next-start="nextStart"
            @change="emit('changeCycle', $event)"
          />
        </AccordionSection>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AccordionSection from './AccordionSection.vue'
import AccountPane from './AccountPane.vue'
import BudgetsPane from './BudgetsPane.vue'
import CyclePane from './CyclePane.vue'
import LoginPane from './LoginPane.vue'
import type { Budget, Cycle, User } from '../types'

defineProps<{
  /** `null` while logged out, which swaps the pane for the login fields. */
  user: User | null
  budget: Budget
  cycle: Cycle
  /** Start of the cycle in progress, `YYYY-MM-DD`. */
  cycleKey: string
  /** Display form of the cycle, e.g. `01-15-2026 - 02-15-2026`. */
  cycleLabel: string
  currentStart: string
  nextStart: string
}>()

const emit = defineEmits<{
  login: [credentials: { email: string; password: string }]
  signUp: [credentials: { email: string; password: string }]
  logout: []
  setBudgetPermanent: [amount: number]
  setBudgetTemporary: [amount: number]
  clearBudgetTemporary: []
  changeCycle: [startDay: number]
}>()
</script>
