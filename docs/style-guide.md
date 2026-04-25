# Style Guide

This file is the single source of truth for MRTQuest's visual design tokens.
All values here map directly to CSS custom properties declared inside `@theme` in `app/globals.css`.

> **Tailwind v4 note:** There is no `tailwind.config.js`. Tokens are registered
> via `@theme { ... }` in CSS and consumed as `bg-[var(--token)]` or, where a
> Tailwind alias exists, as `bg-primary`. Add new tokens to `globals.css` first,
> then document them here.

---

## How to Use a Token

```css
/* globals.css — register the token */
@theme {
  --color-primary: #00A959;
}
```

```tsx
/* In a component — two equivalent ways */
<div className="bg-[#00A959]">          {/* hardcoded — avoid */}
<div className="bg-[var(--color-primary)]"> {/* preferred */}
```

---

## Colors

### Brand

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#00A959` | CTA buttons, active nav, check-in button, progress bars |
| `--color-accent` | `#FFD520` | Star ratings, highlight badges, accent chips |
| `--color-brand-heading` | `#064E3B` | Brand heading accent and dark green text |

**Alternatives to consider for `--color-primary`**

| Option | Hex | Notes |
|---|---|---|
| Current | `#00A959` | Vibrant MRT green — high contrast on white |
| Softer | `#00C264` | Slightly lighter, more modern feel |
| Deep | `#007A40` | Better for dark backgrounds |

**Alternatives to consider for `--color-accent`**

| Option | Hex | Notes |
|---|---|---|
| Current | `#FFD520` | Bold yellow, strong contrast |
| Warm | `#FFC107` | Material Design amber |
| Muted | `#F5C518` | Slightly softer, warmer yellow |

---

### Text

| Token | Value | Usage |
|---|---|---|
| `--color-foreground` | `#171717` | Default body text |
| `--color-heading` | `#2D3250` | Section headings, primary labels |
| `--color-brand-heading` | `#064E3B` | Brand heading accent and dark green text |

**Alternatives to consider for `--color-heading`**

| Option | Tailwind equivalent | Notes |
|---|---|---|
| Current | `text-slate-900` | Strong neutral heading color |
| Brand | `text-emerald-700` | Dark green accent for branded headers |
| Neutral | `text-slate-700` | Softer, more muted headings |

---

### Backgrounds

| Token | Value | Usage |
|---|---|---|
| `--color-background` | `#ffffff` | Page base (overridden by gradient on most pages) |
| `--color-surface` | `rgba(255,255,255,0.7)` | Cards, header, modals (glassmorphism) |
| `--color-modal-backdrop` | `rgba(15, 23, 42, 0.7)` | Modal and overlay backdrops |

**Page gradient** (not a token — applied directly as Tailwind utilities):
```
bg-linear-to-br from-pink-50 via-purple-50 to-blue-50
```

Gradient alternatives:

| Name | Classes | Feel |
|---|---|---|
| Current (pink→purple→blue) | `from-pink-50 via-purple-50 to-blue-50` | Playful, pastel |
| Warm (peach→rose) | `from-orange-50 via-rose-50 to-pink-50` | Warmer, cosy |
| Cool (sky→indigo) | `from-sky-50 via-indigo-50 to-blue-50` | Calm, minimal |
| Monochrome | `from-slate-50 to-white` | Clean, professional |

---

### Status Colors

| Token | Value | Usage |
|---|---|---|
| `--color-success` | `#00A959` (same as primary) | Earned badges, confirmed check-ins |
| `--color-error` | `#ef4444` (red-500) | Form validation errors, failed states |
| `--color-warning` | `#f59e0b` (amber-500) | Pending/unverified suggestions |
| `--color-locked` | `#94a3b8` (slate-400) | Locked badges, inactive stations |

---

## Spacing & Sizing

| Token | Value | Usage |
|---|---|---|
| `--radius-card` | `1rem` | Attraction cards, badge cards |
| `--radius-modal` | `1.25rem` | Modal dialogs |
| `--radius-chip` | `9999px` | Category filter pills, status chips |

**Alternatives to consider for `--radius-card`**

| Option | Value | Feel |
|---|---|---|
| Current | `1rem` (16px) | Rounded, friendly |
| Subtle | `0.5rem` (8px) | More structured |
| Pill | `1.5rem` (24px) | Very soft, iOS-style |
| Sharp | `0.25rem` (4px) | Minimal, Material-style |

---

## Typography

| Token | Value | Usage |
|---|---|---|
| `--font-sans` | `var(--font-quicksand)` | Default body and UI text |
| `--font-mono` | `var(--font-geist-mono)` | Code snippets and monospace UI elements |
| `--font-lilita-one` | `var(--font-lilita-one)` | Decorative/gamified headings and hero text |
| `--font-fredoka` | `var(--font-fredoka)` | Optional accent font for playful UI elements |
| `--font-outfit` | `var(--font-outfit)` | Optional modern UI text |

### Type Scale (Tailwind defaults — no custom tokens needed)

| Role | Class | Size |
|---|---|---|
| Page title | `text-3xl font-serif` | 1.875rem |
| Section heading | `text-xl font-semibold` | 1.25rem |
| Card title | `text-base font-semibold` | 1rem |
| Body | `text-sm` | 0.875rem |
| Label / metadata | `text-xs` | 0.75rem |

---

## Shadows & Effects

| Effect | Classes | Usage |
|---|---|---|
| Card glass | `bg-white/70 backdrop-blur-sm` | Attraction cards, header, modals |
| Card border | `border border-white/60` | Card outlines on glass surfaces |
| Subtle shadow | `shadow-sm` | Elevated cards |
| Hover lift | `-translate-y-1 transition-transform` | Badge cards on hover |

---

## Layout Constants

| Constant | Value | Where set |
|---|---|---|
| Max content width | `max-w-lg` (32rem) | Every page wrapper |
| Bottom padding (tab bar) | `pb-24` | `app/layout.tsx` main element |
| Tab bar height | `h-16` | `TabBar.tsx` |
| Header height | `~64px` | `Header.tsx` sticky |
| Safe area bottom | `env(safe-area-inset-bottom)` | `body` in `globals.css` |

---

## Component Quick Reference

| Component | Key tokens used |
|---|---|
| Primary button (Check In) | `bg-[var(--color-primary)] text-white` |
| Secondary button (Directions) | `bg-blue-500 text-white` |
| Active tab icon | `text-[var(--color-primary)]` |
| Star rating (filled) | `text-[var(--color-accent)]` |
| Earned badge card | `bg-emerald-50 border-emerald-200` |
| Locked badge card | `bg-slate-100 grayscale opacity-80` |
| Modal backdrop | `fixed inset-0 z-50 bg-slate-950/70` |
| Page gradient | `bg-linear-to-br from-pink-50 via-purple-50 to-blue-50` |

---

## Applying Token Changes

To change a value globally:

1. Update the CSS variable value in `app/globals.css` inside `@theme { ... }`
2. Update the table above to reflect the new value
3. No component edits needed — components reference the variable, not the hardcoded hex

```css
/* app/globals.css */
@theme {
  --color-primary: #00C264;   /* changed from #00A959 */
  --color-accent: #FFC107;    /* changed from #FFD520 */
  --radius-card: 0.5rem;      /* changed from 1rem */
}
```
