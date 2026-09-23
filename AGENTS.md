# AGENTS.md — balance-nuxt

Working notes for AI agents editing this repo. Read this before touching code.

## What this is

A mobile-style fintech balance UI built in Nuxt 4. Single page, three tabs
(Transactions / Accounts / Settings), no backend. State lives in `app/app.vue`
and is lost on reload. Deployed to Vercel from `main`.

## Commands

```sh
npm run dev      # dev server, http://localhost:3000
npm run build    # production build — the only reliable verification
npm run generate # static output
npm run preview  # serve the built output
```

There is no test runner and no linter configured. `npm run build` is the
verification step; it catches SSR-only failures, which matter because Swiper
touches `window` during init. `npx nuxi typecheck` prompts interactively to
install `vue-tsc` and hangs — do not use it.

## Stack

| Package | Version | Notes |
|---|---|---|
| nuxt | 4.5.2 | `app/` is the source dir |
| vue | 3.5.42 | `<script setup>` + `defineModel` |
| tailwindcss | 3.4.19 | via `@nuxtjs/tailwindcss@6` |
| swiper | 14.2.0 | the swipe controls |
| pinia | 4.0.3 | installed, **not used** |
| @nuxt/fonts | 0.14.0 | Space Grotesk, local provider |
| @nuxt/icon | 2.5.1 | `lucide` set; `@iconify-json/lucide` is a **devDependency** |

## Layout

```
app/
  app.vue                 shell: owns ALL state, all CRUD handlers
  tabs.ts                 TABS, Tab, TAB_ORDER
  types.ts                Transaction, Account, User, Cycle, Budget, AccountType
  format.ts               formatAmountInput, parseAmount
  cycle.ts                cycleStartOnOrBefore, cycleStartAfter, formatCycleDate
  categories.ts           CATEGORIES — 9 entries
  components/
    TabSwitcher.vue       icon buttons + active dot
    TabSwiper.vue         swiper over the three tab panels
    TransactionsTab.vue   SwipeToTransact + transaction list
    AccountsTab.vue       account list + ADD button
    SettingsTab.vue       three AccordionSections
    AccordionSection.vue  accordion primitive
    LoginPane.vue         email/password, LOG IN / SIGN UP
    AccountPane.vue       logged-in view, LOG OUT
    BudgetsPane.vue       cycle budget: SET PERMANENT / SET TEMPORARY
    CyclePane.vue         cycle dates + start-day field
    SwipeControl.vue      generic swipe control (the core primitive)
    SwipeToTransact.vue   SwipeControl wrapper: PAY / REFUND
    TransactionDetails.vue  modal: EDIT / DELETE
    TransactionItem.vue   transaction row
    AccountDetails.vue    modal: SAVE / DELETE
    AccountItem.vue       account row
    ProgressBar.vue       percent or value/total bar
    SelectPane.vue        native <select>
    MarkdownEditor.vue    WRITE / PREVIEW, hand-rolled markdown
    AmountField.vue       UNUSED — nothing imports it
assets/css/main.css       tailwind entry
public/fonts/             SpaceGrotesk-Variable.ttf  (the one that is served)
fonts/                    duplicate, unreferenced
```

## Hard rules

These are all things that have already caused a bug in this repo.

**Tailwind is v3.** `@theme` is v4-only and silently produces nothing. Extend
`tailwind.config.ts` or write literal CSS.

**`assets/` is at the project root, not under `app/`.** `~/assets/...` does not
resolve. Use `~~/assets/...` or a public path like `/fonts/...`.

**`noUncheckedIndexedAccess` is on.** Every array index returns `T | undefined`.
Write `arr[0] ?? ''`, not `arr[0]`.

**`<script setup>` cannot contain `export`.** Not even `export type`. Shared
constants and types go in a plain module (`app/tabs.ts`, `app/types.ts`,
`app/categories.ts`, `app/cycle.ts`).

**Nuxt prefixes nested component names with the directory.** A component at
`app/components/tabs/Foo.vue` registers as `TabsFoo`. This is why the tab
components sit flat in `app/components/` with a `Tab` suffix.

**Never combine `v-model` and `@input` on one element and read the ref in the
handler.** Both listen to `input`; the ref may not hold the new value yet. Read
`event.target.value`. See `SwipeToTransact.vue` for the pattern, including the
re-sync of the DOM node after formatting.

**Amount inputs are `type="text" inputmode="decimal"`.** `type="number"`
silently rejects the commas the formatter inserts.

**Do not hardcode `w-96` inside a padded container.** That was the accounts-list
overflow: a `w-96` bar inside a `w-96` row with `p-4`, overflowing by exactly the
32px padding. Use the `fullWidth` prop on `ProgressBar`.

**Flex children default to `min-height: auto`** and refuse to shrink below their
content. Any scroll container inside a flex column needs `min-h-0`; the panel
that should absorb leftover space needs `flex-1`.

**A native `<select>` popup cannot be styled.** The open list is drawn by the OS.
`<optgroup>` label classes apply in Firefox and are ignored by Chrome, Edge, and
Safari. If grouping must be styled, fold the group name into the option text
(`DEBIT - BDO *3000`) or build a custom listbox. Do not reach for `<optgroup>`
expecting it to match the app's typography.

## Swiper rules

`SwipeControl.vue` is the only place that should know these. If you write a new
swiper, copy its guards.

- `slideChange` fires three times per interaction: during `init`, on user
  release, and on snap-back. Guard with `isReady` (set from `@swiper`),
  `isSnappingBack`, and `hasFiredThisGesture`.
- **Use `swiper.swipeDirection` for direction, never `previousIndex`.** The
  snap-back calls `slideTo` between user swipes, so `previousIndex` is stale by
  one step.
- `swipeDirection === 'next'` means the track moved left, revealing the
  right-hand slide. That is a **right-to-left** user swipe.
- **Never call `slideTo` synchronously inside `onSlideChange`.** It re-enters
  Swiper mid-init and throws `swiper is undefined`. Wrap it in `nextTick`.
- `SwiperClass` is exported from `'swiper/types'`, not from `'swiper'`.
- `.swiper-slide` is `height: 100%`; the swiper's height comes from its tallest
  slide.
- `:nested="true"` on `SwipeControl` stops the tab swiper from stealing its
  gesture.
- `:touch-start-prevent-default="false"` and `:prevent-clicks="false"` keep
  inputs and selects usable inside a slide.
- `:touch-ratio="0.5"` caps the visual drag at 50%.
- **`:simulate-touch="true"` stays.** It is what makes a mouse drag work on
  desktop. The user was told to remove it before shipping and declined: *"That's
  fine, if that's off then I wouldn't be able to transact, no?"* Do not remove
  it, and do not repeat the advice.

## Design language

Monospace-ish, uppercase, `tracking-wider`, `text-sm` labels. Surfaces are
`bg-neutral-50` and `bg-neutral-100`. High-contrast black/white. Amounts are
`text-6xl text-right`. Refunds are `text-red-600`. Modals are a `bg-black/50`
overlay wrapping a `SwipeControl` whose `title` reads `SWIPE TO <ACTION>`.

Responsive: every panel is `w-full sm:w-[30rem]`. Swipers need
`!w-full sm:!w-[30rem]` because Swiper's own CSS sets a width on `.swiper`. The
shell is `p-4 sm:py-8`.

## Working style

**Ask for the error text or the observed behavior before theorizing.** Three
turns were burned on a font bug that a stack trace resolved instantly.

**When behavior is wrong, check the simplest explanation first:** reversed emit
mapping, wrong variable, name mismatch, missing flag. An "EDIT deletes the
transaction" bug was diagnosed as a double-fire and fixed with a defensive
guard; the real cause was a one-line reversed mapping. The user's response:
*"You did so much, the action is just reversed."*

**"The tabs are not showing" meant the components, not the icons.** Two turns
went into installing an icon set before the real cause (the Nuxt directory name
prefix) surfaced. Read the code before assuming what a report means.

**Announce the plan before multi-file work.** The user has asked for this
explicitly, and it catches scope disagreements before any file is written.

## Decisions that look like bugs but are not

1. **Budget is one number per cycle, not per category.** The user was explicit:
   *"I specifically do not want to have a budget for every category as I don't
   want them specific and makes budgeting complicated."* Do not reintroduce
   per-category budgets.
2. **`:simulate-touch` is intentional.** See the swiper rules.
3. **Credit accounts show a plain `CREDIT LIMIT` amount,** not a remaining-credit
   progress bar. `creditUsed` was removed by request.
4. **Account `type` is immutable after creation.** Switching credit to debit
   would orphan the three credit-only fields.
5. **`AccountDetails` uses SAVE; `TransactionDetails` uses EDIT.** Different
   handlers, both intentional.
6. **Tab swipe does not wrap around.**
7. **`@iconify-json/lucide` stays a devDependency.** `@nuxt/icon` uses local
   bundle mode and Vercel installs devDependencies during build.

## Known gaps

1. `onPay` / `onRefund` in `app.vue` create transactions but never touch an
   account balance. Credit accounts have no `creditUsed` field — it was removed
   by request; there is no credit-payment feature.
2. Markdown is hand-rolled in `MarkdownEditor.vue`, not a library. It supports
   headings, bold, italic, inline code, links, and lists.
3. Pinia is installed but unused. All state is local refs in `app.vue`.
4. No persistence. Reload resets everything.
5. A cycle start-day change applies immediately, despite `CyclePane` rendering
   `TAKES EFFECT ON THE NEXT CYCLE`. Fixing it needs a `pendingStartDay` that
   commits when the current cycle ends. **The user has not agreed to this fix.**
6. `AmountField.vue` is dead code. `BudgetsPane`, `SwipeToTransact`, and
   `TransactionDetails` each inline their own amount input.
7. Renaming an account does not update the `account` string on existing
   transactions. Changing the option-label format does the same: the stored
   string stops matching any option, and the select renders blank.
8. There is no click fallback on `SwipeToTransact`. A desktop user who does not
   know to drag has no way to submit. The user was offered a fix and implicitly
   declined.
9. The duplicate `fonts/` copy at the repo root is unreferenced. `nuxt.config.ts`
   points at `/fonts/SpaceGrotesk-Variable.ttf`, which resolves to `public/`.
10. `hasFiredThisGesture` in `SwipeControl.vue` was added for the wrong reason (a
    misdiagnosed double-fire) but does prevent double-fires on fast swipes. The
    user was offered its removal and never responded.