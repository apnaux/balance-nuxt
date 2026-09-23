# WORKFLOWS.md — balance-nuxt

How to make changes in this repo without breaking the swipe controls.

## The loop

There is no test runner. `npm run build` is the real check. `npx nuxi typecheck`
prompts interactively to install `vue-tsc` and hangs — do not use it.

```sh
npm run build   # catches SSR-only failures, which Swiper is prone to
npm run dev     # http://localhost:3000, then check the browser
```

`npm run build` catches compile and SSR errors but says nothing about behavior.
Behavior has to be checked in the browser. When reporting back, say which of the
two you did.

## Adding a feature

1. **Decide where state lives.** Domain data goes in `app/app.vue`. A component
   never owns a `Transaction` or an `Account`; it receives props and emits.
2. **Add the type** to `app/types.ts` if it is shared. Never `export` from
   `<script setup>`.
3. **Add the handler** to `app.vue`, then pass it down as an emit listener.
4. **Build the component** in `app/components/`, flat. No subdirectories — Nuxt
   would prefix the registered name.
5. **Verify in the browser** at both widths: below `640px` and above.

## Adding a swipe action

Copy `SwipeControl.vue`. Do not write a new Swiper from scratch.

1. Wrap the content in `<SwipeControl>`, passing `title`, `leftLabel`,
   `rightLabel`, and the two `*-class` props.
2. Handle `@left` and `@right`. Remember `left` is a left-to-right gesture.
3. If the control sits inside `TabSwiper`, confirm `:nested="true"` is still on
   `SwipeControl`. Without it the tab swiper steals the gesture.
4. If the slide contains an input or a select, confirm
   `:touch-start-prevent-default="false"` and `:prevent-clicks="false"`.
5. Test all four: swipe left-to-right, right-to-left, a short drag that should
   snap back, and a fast flick. Each must fire exactly one action.

If an action fires twice, check the guards in this order: `isReady`,
`isSnappingBack`, `hasFiredThisGesture`. If it fires in the wrong direction,
check the `swipeDirection` mapping before anything else.

## Adding a tab

1. Add an entry to `TABS` in `app/tabs.ts` with a `lucide:` icon name.
2. Create `app/components/<Name>Tab.vue`.
3. Add a `<template #<value>>` block in `app/app.vue`'s `TabSwiper`.
4. `TabSwitcher` and `TabSwiper` both read `TABS` and `TAB_ORDER`, so no other
   wiring is needed.

Tab order in `TAB_ORDER` is the swipe order. Swiping does not wrap around.

## Adding a form field

1. Add the field to the relevant type in `app/types.ts`.
2. Add a `ref` in the modal component, seeded from props with `?? ''`.
3. Add the input. Follow the existing label pattern: a `tracking-wider text-sm
   font-medium` label with `p-4 pb-[2px]`, then the input with `mx-4 mb-4`.
4. Include it in the `emit('save', { ... })` payload.
5. Handle it in the `app.vue` handler.

**Numeric fields are held as strings** so they can be cleared while typing, and
coerced with `Number(x) || undefined` on save. **Amount fields** use
`formatAmountInput` / `parseAmount` and must be `type="text"
inputmode="decimal"`.

## Adding a modal

Copy `TransactionDetails.vue`. The shape is fixed:

```
fixed inset-0 z-50 bg-black/50  →  click.self closes
  └─ bg-white p-4, w-full sm:w-auto, max-h-[90svh] overflow-y-auto
       └─ SwipeControl title="SWIPE TO <ACTION>"
            └─ panels, each w-full sm:w-[30rem]
```

The modal is rendered with `v-if` in `app.vue`, not inside the tab panel, so it
escapes the swiper's overflow.

## Changing layout

Every panel is `w-full sm:w-[30rem]`. Swipers need `!w-full sm:!w-[30rem]`
because Swiper's stylesheet sets a width on `.swiper`.

For a panel that should fill leftover vertical space:

```
flex-1 min-h-0        on the panel
overflow-y-scroll     on the inner scroller
```

`min-h-0` is required. A flex child defaults to `min-height: auto` and will not
shrink below its content, which silently breaks scrolling.

## Debugging

**Get the error text first.** Ask for the stack trace or the observed behavior
before forming a theory. A font-loading bug cost three turns of path changes
that a stack trace would have resolved immediately.

**Check the simplest explanation first.** In order:

1. Is the emit mapping reversed?
2. Is the wrong variable or prop being read?
3. Does the component name match what Nuxt registered?
4. Is a Swiper flag missing (`nested`, `touch-start-prevent-default`,
   `prevent-clicks`)?
5. Only then: is there a race or a double-fire?

**Read the report literally.** "The tabs are not showing" meant the components,
not the icons. Two turns went into installing an icon set before the real cause
— the Nuxt directory name prefix — surfaced.

## Pre-ship checklist

1. Run `npm run build` and confirm it succeeds. Swiper is SSR-sensitive.
2. Test at `375px` and at `1440px` wide.
3. Test every swipe control with a mouse drag and with touch emulation.
4. Confirm the font still loads: `public/fonts/SpaceGrotesk-Variable.ttf` should
   appear in the network tab on load.

**Do not remove `:simulate-touch="true"`.** The user was told to drop it before
shipping and explicitly declined — without it a mouse drag does not work on
desktop, so the app would have no way to transact. It stays in `SwipeControl.vue`
and `TabSwiper.vue`.

`npx nuxi typecheck` is not part of this checklist. It hangs on the install
prompt. Use `npm run build`.

## Known gaps

1. `onPay` / `onRefund` do not touch account balances. There is no
   credit-payment feature and no `creditUsed` field.
2. No persistence. Reload resets all state.
3. Pinia is installed but unused.
4. Markdown is hand-rolled, not a library.
5. Renaming an account does not update the `account` string on existing
   transactions. Changing the label format does the same — including the change
   that added the `DEBIT - ` / `CREDIT - ` prefix.
6. A cycle start-day change applies immediately, despite the `TAKES EFFECT ON
   THE NEXT CYCLE` label. **The user has not agreed to the fix.**
7. `AmountField.vue` is dead code.
8. No click fallback on `SwipeToTransact` for desktop users who do not know to
   drag. Offered and declined.

## Adding an option to a native select

`SelectPane.vue` renders a flat `<option>` list. Do not reach for `<optgroup>`.
The open popup is drawn by the OS: label classes apply in Firefox and are
ignored by Chrome, Edge, and Safari. An `<optgroup>` added here produced exactly
that mismatch and the user's response was *"it looks so odd"*.

To group by type, build the group name into the option text:

```ts
const accountOptions = computed(() =>
  props.accounts.map(a => `${a.type === 'credit' ? 'CREDIT' : 'DEBIT'} - ${a.bankShortName} *${a.last4}`),
)
```

Changing the format invalidates stored values. A transaction whose `account`
string no longer matches any option renders a blank select until the user picks
again. If that matters, make the lookup tolerant of both formats.

If the grouping genuinely must be styled, the only path is a custom listbox —
a button plus an absolutely positioned `<ul>`, with keyboard nav, focus, and
outside-click handling written by hand. Roughly an hour of work. Not done yet.

## Adding a settings section

1. Create `app/components/<Name>Pane.vue`. Flat in `app/components/`.
2. Take the data as props. Do not import `app.vue`'s refs.
3. Emit a single event per mutation. `app.vue` owns the handler.
4. Render it inside an `AccordionSection` in `SettingsTab.vue`, passing `title`
   and the props.
5. Verify the accordion still opens and closes — `AccordionSection` owns that
   state, and a pane that renders nothing makes the section look broken.
