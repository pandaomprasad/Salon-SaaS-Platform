# 🍎 ST CUT Customer App — Apple-Style Design Optimization Guide

> **Purpose**: Concrete, implementable instructions for redesigning the ST CUT customer app to feel like a native Apple-quality product — fluid motion, physical materials, disciplined typography, and interruptible gestures. Written for an AI coding agent (e.g. Antigravity) to execute directly against the existing codebase.
>
> **Source doctrine**: Apple's WWDC design talks — *Designing Fluid Interfaces* (2018), *The Details of UI Typography* (2020), *Designing Audio-Haptic Experiences*, *Principles of Great Design* (2026) — translated to web/React Native primitives (Pointer Events, `requestAnimationFrame`, a spring library like Motion/Framer Motion or Reanimated).

---

## 0. The One-Line Philosophy

> An interface feels alive when motion starts from the current on-screen value, inherits the user's velocity, projects momentum forward, and can be grabbed and reversed at any instant.

Everything below is in service of that sentence. If a change doesn't make the app feel more *directly touchable*, skip it.

---

## 0. Safe Rollout Strategy — don't touch `development` directly

You don't yet know if the new design will work well, so the current `development` branch stays untouched until the redesign is proven out.

- [ ] Create a new branch off `development` dedicated to this redesign, e.g. `redesign/apple-motion` — **never** commit motion-engine changes directly to `development`.
- [ ] Do the Step 0 strip-out (below) and every rebuild step in that branch only.
- [ ] If the codebase supports it, gate the new motion system behind a feature flag / config toggle (e.g. `ENABLE_FLUID_UI=true`) so it can be flipped on for internal testing without affecting the default build. If no flag system exists, keep the redesign fully isolated on the branch instead of adding one just for this.
- [ ] Test the redesign branch thoroughly on real devices (motion, gestures, reduced-motion, dark mode) before opening a PR into `development`.
- [ ] Merge into `development` only after you've confirmed the new design actually feels better — not before. Treat this document as a working branch's worth of changes, not a same-day swap into your main line of work.
- [ ] If something in the redesign doesn't work out, the branch is disposable — `development` was never touched, so there's nothing to revert.

Everything below assumes you're working inside that isolated branch.

---

## 1. Motion Engine — rip out everything, rebuild with springs

**Current state**: All transitions in the spec are described as generic "slides up," "fades in," "smoothly slides." No spring/physics model, no interruptibility.

### Step 0 — Strip every existing animation and transition first

Before adding anything new, delete the current motion layer entirely rather than patching it. Mixing old fixed-duration CSS transitions with new springs produces inconsistent, half-fluid UI that feels worse than either approach alone.

- [ ] Remove **every** `transition:` / `transition-property:` declaration from CSS/styled-components.
- [ ] Remove **every** `@keyframes` block and its `animation:` usage.
- [ ] Remove any `.animate-*` / Tailwind `transition`, `duration-*`, `ease-*` utility classes.
- [ ] Remove native-side equivalents: `Animated.timing`, `LayoutAnimation`, `CSSTransition`/`TransitionGroup` wrappers, React Navigation's default screen-transition config, any `framer-motion` `transition: { duration }` props already in place.
- [ ] Remove ad-hoc `setTimeout`/`requestAnimationFrame` hacks used to fake sequencing (e.g. delaying a class toggle to "let a transition play").
- [ ] Audit and remove debounce/delay timers that aren't strictly necessary (the 300ms search debounce, artificial "loading" delays, etc. — see §1 note below).
- [ ] After stripping, every touchable element should snap instantly with **no** motion until springs are reintroduced component-by-component per this doc. Ship/commit this bare state first so regressions are easy to isolate.

Only once the codebase is motion-free should the spring system below be added back in — deliberately, component by component, not by re-enabling the old defaults.

### Rebuild: spring-driven motion

**Action**:
- Install a spring-driven animation library (`motion`/Framer Motion for web, `react-native-reanimated` for native) and route **every** touchable, draggable, or gesture-dismissable element through it. Do not reach for plain CSS `transition` at all going forward — even simple hover/color changes should use the same spring system so the whole app has one consistent motion language.
- Replace all `@keyframes` / fixed-duration transitions on sheets, cards, and toggles with springs using this house style:

| Interaction | Damping | Response | Notes |
|---|---|---|---|
| Default UI (menus, toggles, tab switches) | `1.0` | `0.3–0.4` | Critically damped, no bounce |
| Sheet / modal open-close | `0.8` | `0.3` | Slight bounce reads as physical |
| Card reposition (e.g. cart bar, reorder) | `1.0` | `0.4` | |
| Flick / momentum release (drag-dismiss, swipe) | `~0.8` | `0.3–0.4` | Only when the gesture itself carried velocity |

- **Rule**: never animate to a fixed duration for anything the user can touch. A spring's settle time should emerge from damping/response, not be hardcoded.

```js
import { animate } from 'motion';

// Default: sheet opening, no gesture involved yet
animate(sheetEl, { y: 0 }, { type: 'spring', bounce: 0.15, duration: 0.3 });

// Momentum: user flicked the sheet closed
animate(sheetEl, { y: sheetHeight }, {
  type: 'spring', bounce: 0.2, duration: 0.35, velocity: releaseVelocity
});
```

---

## 2. Interruptibility — every sheet must be grabbable mid-flight

**Current state**: `SlotModal`, `FilterModal`, `LocationPickerModal`, `RescheduleModal`, `CancelModal`, `ReviewModal` all "slide up" / "open" as one-shot animations.

**Action**:
- Wire drag handlers (Pointer Events, `setPointerCapture`) onto every sheet's grab handle so the user can pull it down at any point — including mid-open — and have it follow the finger 1:1.
- On interrupt, **always read the sheet's live on-screen transform** and start the new (reverse) animation from there. Never animate back to the target/closed value from scratch — that causes a visible jump.
- Never disable taps/drags on the sheet or its scrim while it's animating in or out. If a spinner or lock currently gates the sheet during animation, remove it.
- When a drag is released, decide **reverse vs. commit** using the release **velocity's sign**, not just how far it was dragged. A fast flick partway down should dismiss; a slow drag that stops halfway should snap back.

---

## 3. Direct Manipulation & Response — kill every dead tap

**Current state**: `"+ Add"` → `"✓ Added"` toggle, category chips, star ratings, and date/specialist/time pickers are all described as static tap targets with no press feedback spec.

**Action, screen by screen**:

### Salon Detail — Service Row `+ Add` button
- Highlight (scale `0.97`, 100ms) on `pointerdown`, not on release. The gold fill/checkmark commits on `pointerup` only if the pointer is still over the button.
- Add ~10px hit-padding hysteresis so a slightly-off tap still registers.

### Slot & Specialist Picker Modal
- **Date Strip / Specialist Strip**: convert from static button rows into a 1:1-tracked drag surface.
  - Use Pointer Events + `setPointerCapture`; track a short position/timestamp history for velocity.
  - Rubber-band at the first and last date/specialist instead of a hard stop:
    ```js
    function rubberband(overshoot, dimension, constant = 0.55) {
      return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
    }
    ```
  - On flick-release, **project** where the strip is heading (not just the release point) and snap to the nearest date to that projected position:
    ```js
    function project(v, decel = 0.998) { return (v / 1000) * decel / (1 - decel); }
    const target = nearestSnapPoint(currentPosition + project(releaseVelocity));
    ```
- **Time Grid**: tap highlight on `pointerdown`; selected slot fill (solid gold) commits on `pointerup`.

### Review Modal — Star Rating
- Support drag-across-stars with continuous fill feedback (not just 5 discrete taps) — this is a case where 1:1 tracking makes a small control feel dramatically more tactile.

### Category Chips / Quick Rebook Capsule
- Same instant `pointerdown` highlight rule — these are tapped rapidly and repeatedly, so dead feedback here is the most noticeable.

---

## 4. Spatial Consistency — anchor sheets to what triggered them

**Current state**: `FilterModal` opens from a small `⚙️` icon inside the search bar, but is currently just "a modal that opens." `SlotModal`, `LocationPickerModal`, etc. are generic centered/bottom sheets with no stated origin.

**Action**:
- Set `transform-origin` on each modal/popover to the element that triggered it, so it visibly grows from that point:
  - `FilterModal` → origin at the `⚙️` icon.
  - `LocationPickerModal` → origin at the location pill (top-left header).
  - `ReviewModal` → origin at the "Rate Service" button.
- **Exit path must mirror the entry path.** If a sheet enters sliding up from the bottom, it must exit sliding down — never up-then-fade or any asymmetric combo.
- Mirror the easing curve between open/close (inverse cubic-bézier control points) so the return motion feels like rewinding, not a different animation.

---

## 5. Materials & Depth — make surfaces feel like glass, not paint

**Current state**: The palette (`#0D0D0D`, `#1C1C1E`, `#2A2A2C`) is defined as flat opaque hex values. No translucency anywhere.

**Action**:
- **Sticky Bottom Checkout Bar** and **modal headers**: convert to translucent material layers, content scrolling underneath instead of stopping at a hard edge.
  ```css
  .checkout-bar {
    background: rgba(28, 28, 30, 0.7); /* #1C1C1E at 70% */
    backdrop-filter: blur(20px) saturate(160%);
    border-top: 1px solid rgba(255, 255, 255, 0.08); /* light catching the top edge */
  }
  ```
- **Keep the gold CTA solid**, never translucent — color/vibrancy belongs on a solid layer per Apple's own rule, translucency is for structural chrome only.
- **Never stack two light translucent surfaces** — e.g. don't put a translucent toast on top of an already-translucent sheet header; legibility collapses. Use a heavier/solid layer underneath.
- **Bigger surfaces read thicker**: give `SlotModal` (full-height sheet) stronger blur + deeper shadow than small elements like the Notification Bell's red dot or a chip.
- **Dim to focus, separate to keep flow**:
  - Blocking, task-focused sheets (`SlotModal`, `CancelModal`, `LogoutModal`) → pair with a dimming scrim, push the background back.
  - Non-blocking, glanceable UI (Quick Rebook capsule, toast confirmations) → translucency + slight offset, **no scrim**, so it doesn't interrupt flow.
- **Scroll-edge effects, not hard 1px dividers.** Where the sticky checkout bar or a sticky filter header meets scrolling content, fade a small gradient/blur mask instead of a flat border line.
- **Materialize, don't just fade.** Animate blur radius *and* scale together when a sheet/toast enters or exits, so it reads as a physical material arriving, not an opacity fade.

---

## 6. Typography — give it real hierarchy

**Current state**: Spec defines only text *colors* (`#FFFFFF` primary, `#A0A09C` secondary). No size, weight, tracking, or leading system.

**Action**:
- Default to the platform system font (`-apple-system`/`system-ui` on web, San Francisco on native) unless there's a specific brand reason to diverge — it already ships correct optical sizing and tracking tables.
- Build a **type scale** that pairs size with matching tracking/leading — never one fixed `letter-spacing` everywhere:

| Use | Size | Weight | Tracking | Leading |
|---|---|---|---|---|
| Salon name / screen title | 28–34px | Bold (700) | `-0.02em` | `1.05` |
| Section headers ("Services", "Reviews") | 18–20px | Semibold (600) | `-0.01em` | `1.2` |
| Body / service description | 15–16px | Regular (400) | `0em` | `1.5` |
| Secondary / metadata (distance, duration) | 13px | Regular (400) | `+0.01em` | `1.4` |
| Price / total ("₹448") | 20–24px | Bold (700) | `-0.01em` | `1.1` |

- Scale layout in `rem`/`em`, not fixed `px`, so a larger system text-size setting doesn't break the service-row or slot-grid layouts.
- Build hierarchy from **weight + size + leading together** — don't rely on size alone to separate the salon name from the price.

---

## 7. Reduced Motion, Transparency & Contrast

**Current state**: Not addressed at all.

**Action** — bake these into every shared sheet/toggle/card component, not as an afterthought:
```css
@media (prefers-reduced-motion: reduce) {
  .sheet { transition: opacity 200ms ease; transform: none !important; }
  /* drop elastic/overshoot springs entirely; keep opacity/color changes */
}
@media (prefers-reduced-transparency: reduce) {
  .checkout-bar, .toolbar { background: #1C1C1E; backdrop-filter: none; }
}
@media (prefers-contrast: more) {
  .card { background: #1C1C1E; border: 1px solid rgba(255,255,255,0.4); }
}
```
- Ease the Dark Mode toggle transition (Profile screen) instead of a hard brightness cut — abrupt light/dark jumps read as broken, not intentional.

---

## 8. Screen-by-Screen Action List

### Home Screen
- [ ] Category chips: instant press-highlight, spring-based selection state.
- [ ] Salon Card tap: scale down slightly on press before navigating (confirms the tap registered before the transition even starts).
- [ ] Notification Bell: red dot appears/disappears with a small spring pop, not an instant show/hide.

### Salon Detail Screen
- [ ] `+ Add` → `✓ Added`: pointerdown highlight, commit on pointerup (§3).
- [ ] Sticky Checkout Bar: translucent material (§5), springs up from bottom edge anchored to itself (not a generic slide).
- [ ] Favorite `❤️`: press bounce (damping ~0.7) on toggle — this is a delight moment, not just a state flip.

### Slot & Specialist Picker Modal
- [ ] Whole sheet: spring-driven, interruptible, drag-to-dismiss (§2).
- [ ] Date/Specialist strips: 1:1 drag, rubber-band edges, momentum projection (§3).
- [ ] Time Grid: instant press feedback, no double-tap delay.
- [ ] "Confirm Booking" CTA: disabled state → enabled state should cross-fade + slight scale-in when a slot is picked, not just an instant style swap.

### Explore & Search Screen
- [ ] Remove the flat 300ms debounce on the *UI* — update input/local state instantly, debounce only the network call (§1, opening note).
- [ ] Filter Modal: anchor origin to the `⚙️` icon (§4).

### Bookings Screen
- [ ] Reschedule / Cancel modals: keep confirmation-gated (this is already correct — destructive/irreversible actions only), but make the sheet itself spring-driven and drag-dismissable like the rest.
- [ ] Review Modal stars: drag-across support (§3).

### Profile Screen
- [ ] Dark Mode toggle: eased brightness transition, not a hard cut (§7).
- [ ] Logout Modal: keep as the one other confirmation-gated destructive action — don't add confirmations elsewhere.

---

## 9. Quick Reference Table

| Need | Technique | Value |
|---|---|---|
| Default UI spring | Critically damped | `damping 1.0`, `response 0.3–0.4` |
| Sheet/modal spring | Slight bounce | `damping 0.8`, `response 0.3` |
| Flick/momentum spring | Under-damped | `damping ~0.8`, `response 0.3–0.4` |
| Interrupt cleanly | Start from live transform | never from target value |
| Flick landing point | `current + (v/1000)·d/(1−d)` | `d ≈ 0.998` |
| Rubber-band boundary | Progressive resistance | `constant = 0.55` |
| Translucent chrome | `backdrop-filter: blur(20px) saturate(160%)` | content scrolls under |
| Large text tracking | Negative | `-0.02em` |
| Body text tracking | Neutral/slightly positive | `0` to `+0.01em` |
| Reduced motion | Cross-fade only | `@media (prefers-reduced-motion)` |

---

## 10. Guiding Checklist Before Shipping Any New Component

1. Does it respond on **press**, not release?
2. Can it be **grabbed and reversed** mid-animation?
3. Does its animation start from the **current visual state**, not a hardcoded target?
4. Does it **enter and exit along the same path**?
5. Is it a **spring**, not a fixed-duration transition, if the user can touch it?
6. Does translucency have a **reduced-transparency fallback**?
7. Does large text have **tighter tracking/leading** than body text?
8. Is a confirmation dialog reserved for **genuinely destructive, irreversible** actions only?
