# PROMPT_GUIDE.md — balance-nuxt

How to write prompts that get this repo changed correctly on the first try.

## Why this file exists

Three specific failures in this project's history came from prompt ambiguity,
not from bad code:

1. **"The tabs are not showing"** was read as an icon problem. The user meant
   the tab *components* were not rendering. Two turns went into installing an
   icon set before the real cause (the Nuxt directory name prefix) surfaced.
2. **"Edit deletes the transaction"** was diagnosed as a double-fire and fixed
   with a defensive guard. The actual cause was a one-line reversed emit
   mapping. The user's response: *"You did so much, the action is just
   reversed."*
3. **A font that would not load** was chased through path changes for three
   turns. The stack trace resolved it instantly.
4. **"It looks so odd"** about an `<optgroup>` label was acted on as a styling
   request. The real problem was structural: the popup is OS-drawn and cannot
   be styled at all. The fix was to abandon the grouping mechanism, not to
   adjust its classes.

Each is preventable with a more specific prompt.

## What to include

### 1. Name the file and the line range

Bad: "the swipe thing is broken"

Good: "`SwipeToTransact.vue` lines 83-95 — `onPay` fires on a right-to-left
swipe."

The selection you attach in the editor is enough. Without it, the agent guesses
which of the four swipe-related components you mean.

### 2. Paste the error text

Bad: "the swiper is undefined again"

Good: "`swiper is undefined` at `swiper_vue.js:1891` in `slideTo`, called from
`onSlideChange` in `app.vue:23`."

A stack trace names the file, the function, and the call order. It ends the
guessing immediately.

### 3. Describe the observed behavior as steps

Bad: "the swipe is wrong"

Good:

```
1. I swipe from left to right
2. The console logs "Swiped left: cancel transaction"
3. The element snaps back and logs "Swiped right: confirm transaction"
```

Numbered steps expose whether the problem is direction, timing, or a
double-fire. Prose hides that distinction.

### 4. Say what "done" looks like

Bad: "make the swipe nicer"

Good: "Max drag is 50%. A left-to-right swipe reveals PAY in
`bg-green-100 text-green-800`. A right-to-left swipe reveals REFUND in
`bg-red-100 text-red-800`. Both labels are vertical."

Concrete acceptance criteria mean the agent can self-check before handing back.

### 5. State scope explicitly

Bad: "change the transact part"

Good: "Change only the text that reads `SWIPE TO TRANSACT`. Leave the swipable
element alone."

The user had to say *"No, why did you remove the swipable element ._. I said
just to change the part where it says 'SWIPE TO TRANSACT'"* after a scope
overreach. One sentence up front prevents it.

## Phrases that work here

| Instead of | Say |
|---|---|
| "it's broken" | "it does X, I expect Y" |
| "make it better" | "make it match `<other component>`" |
| "the thing" | the file path and line range |
| "fix the bug" | the error text plus the repro steps |
| "change everything about X" | "change only X, leave Y alone" |
| "looks odd" | "the labels render in the system font, not mine" |
| "not working" | which browser, and what you see instead |

"It looks weird" and "it's not working" are the two reports that consistently
take the most turns. Both are true but neither narrows the cause. One added
clause usually does: "it looks weird **because the headings are in Arial**" or
"not working **in Chrome, but it's fine in Firefox**".

## Prompt templates

### Bug report

```
<file>:<lines> — <what happens>

Steps:
1. ...
2. ...

Expected: ...
Actual: ...

Error: <paste the stack trace>
```

### Feature request

```
Add <feature> to <file>.

Behavior:
- ...
- ...

Design: follow <existing component>.
Do not change: <files or behaviors to leave alone>.
```

### Refactor

```
Move <what> out of <file> into <new file>.

Keep: the existing props, emits, and styling.
Do not change: <anything else>.
```

## Things worth stating every time

**"Do not change anything else."** This repo has a lot of interlocking pieces.
An unrequested refactor of `SwipeControl.vue` breaks both modals and the
transact control at once. The user has said this directly: *"No, why did you
remove the swipable element ._. I said just to change the part where it says
'SWIPE TO TRANSACT'"*.

**"Announce your plan first."** Also stated directly. Before a change that
touches more than one file, write the plan and wait. This catches scope
disagreements before any file is written, which is cheaper than reverting.

**"Follow the existing design language."** Uppercase, `tracking-wider`,
`text-sm`, `bg-neutral-50`/`bg-neutral-100`, black/white. New components that
invent their own styling look wrong next to the rest.

**"Verify in the browser."** There is no test suite. If you do not say the
change was checked, it was not checked. `npm run build` alone is not enough —
it does not exercise the swipe guards.

## What the agent should ask for

If a report is ambiguous, the agent should ask for the error text or the
observed behavior **before** theorizing. If you get a theory instead of a
question, ask it back: *"what do you need to know?"*

## Anti-patterns

1. **Bundling unrelated changes.** "Also fix the font" in the middle of a swipe
   fix makes it impossible to tell which change broke what.
2. **Describing a symptom by its presumed cause.** "The double-fire is back"
   presumes a cause. "The log prints twice" is a fact.
3. **Vague quantity.** "Make it bigger" — bigger by how much, in which
   breakpoint?
4. **Silent scope creep.** "While you're in there..." turns a one-line fix into
   a review of five files.
5. **Proposing a fix for a problem you have not localized.** The agent should
   ask what the error says before writing code. If you get a theory instead of a
   question, ask it back: *"what do you need to know?"*
