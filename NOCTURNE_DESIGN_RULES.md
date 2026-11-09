# NOCTURNE — Permanent Design Rules & Anti-Slop System

> **Philosophy**: NOCTURNE is an intimate after-hours collaborative listening lounge, an independent vinyl record label, and an editorial publication. It is **never** a SaaS dashboard, an AI-generated template, or a generic gadget.

---

## 1. Visual Identity & Design Tokens

All colors, typography, surfaces, and spacing are bound by CSS custom properties declared in `:root` inside `src/styles/globals.css`. Hardcoded hex codes, arbitrary tailwind color utilities (e.g. `zinc-500`, `purple-600`), and raw pixel sizes outside the token scale are strictly forbidden.

### Color Tokens

```css
:root {
  /* Foundations */
  --color-obsidian: #09080E;         /* Deepest abyss ground */
  --color-plum-base: #12101A;        /* Primary section ground */
  --color-plum-surface: #191624;     /* Elevated listening decks and containers */
  --color-plum-subtle: #242033;      /* Dividers, hairline borders, muted rails */

  /* Typographic Ink */
  --color-ivory: #F7F5F0;            /* Warm ivory — all primary headings and active titles */
  --color-warm-grey: #A39DAF;        /* Muted warm grey — secondary text, artist credits, descriptions */
  --color-dim-grey: #6E687A;         /* Tertiary captions, timestamps, quiet metadata */

  /* Singular Restrained Accents */
  --color-lavender: #B99AFF;         /* Principal interactive accent: active states, focus rings, play button */
  --color-lavender-subtle: rgba(185, 154, 255, 0.12); /* Subtle hover fill */
  --color-coral: #FF806B;            /* Meaningful urgency: active skip votes, destructive action */
  --color-coral-subtle: rgba(255, 128, 107, 0.12);
  --color-green: #38D39F;            /* Real sync and online connection states ONLY */
  
  /* Hairline and Borders */
  --border-hairline: rgba(185, 154, 255, 0.10);
  --border-focus: #B99AFF;

  /* Typography */
  --font-serif: 'Cinzel', serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-telemetry: 'Space Grotesk', monospace; /* Restricted strictly to actual numerical figures */
}
```

### Color Usage Mandates
- **No decorative yellow/lime**: Lime/chartreuse is banned as arbitrary decoration.
- **Never color individual heading words randomly**: Headings are set in solid `--color-ivory`. Never one purple or gradient word.
- **Green is reserved strictly for genuine connection state**: Never used as a generic decorative badge.
- **No purple-to-blue or rainbow gradients**: Atmospheric depth is created with physical opacity, tonal contrast, and subtle photographic lighting.

---

## 2. Typography Rules

1. **Two primary font families only**:
   - Display: *Cinzel* (or editorial serif) for main headlines and titles.
   - Body & Controls: *Inter* for body text, button labels, navigation, captions, and track metadata.
   - Numeric figures: *Space Grotesk* used **only** for real numerical values (track timestamps, durations, volume percentage).
2. **The Eyebrow Ban (Hallmark Gate 54 & 67)**:
   - **Never** place an all-caps, tracked micro-label directly above an H1, H2, or H3.
   - Headlines speak for themselves. If context is needed, incorporate it into the headline or section narrative.
3. **No Monospace as Costume (Hallmark Gate 64)**:
   - Monospace is forbidden on labels, categories, chips, bylines, or body descriptions.
   - Use body face at normal case, optical sizing, and standard letter spacing.
4. **No Tracked Capitals (Hallmark Gate 67)**:
   - Labels under 16px must be set in sentence case or natural title case, untracked (no `tracking-[0.2em]`).
5. **No Em-dash (—) Crutch**:
   - Punctuate naturally with commas, colons, or clean line breaks.

---

## 3. Surface & Structural Rules

1. **Reduce container nesting (Hallmark Gate 4)**:
   - **Never** place a card inside a card. One structural containment layer per functional section.
2. **Elevate by lightness, not by border clutter**:
   - Avoid piling border + glow + backdrop-blur + drop-shadow simultaneously (Hallmark Gate F24).
   - Commit to either a crisp hairline border or soft tonal elevation.
3. **No arbitrary rounded pills**:
   - Reserved strictly for actual interactive buttons or explicit status chips.
4. **Asymmetrical, varied layouts (Hallmark Gate 3 & 8)**:
   - Avoid 3 or 4 identical card grids stamped across the screen.
   - Vary measure, alignment, and scale between sections.
5. **Viewport bounds (Hallmark Gate 6a & 34)**:
   - Use `dvh` or `svh` for viewport heights (never `vh`).
   - `overflow-x: clip` on both `html` and `body` (never `hidden`).

---

## 4. Motion & Animation Rules

1. **Meaningful reaction only**:
   - Motion occurs in response to human touch or music playback state changes (play/pause).
   - No gratuitous perpetual pinging rings, floating bubbles, or bouncing cards.
2. **No `transition: all` (Hallmark Gate 10a)**:
   - Explicitly declare properties: `transition-colors`, `transition-opacity`, or `transition-transform`.
   - Never animate layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`).
3. **Card hover discipline (Hallmark Gate 11)**:
   - Do not scale/zoom photographs on card hover (`group-hover:scale-105` is banned).
   - Hover feedback belongs to the card container border or subtle background shift.
4. **Reduced Motion mandatory (Hallmark Gate 27)**:
   - Every animation and transition must strictly respect `prefers-reduced-motion: reduce`.
   - The global quality engine (`high`/`low`/`off`) must continue to completely deactivate non-essential motion.

---

## 5. Authenticity & Content Integrity (Hallmark Gate 46a & 70)

1. **Never fabricate live listener counts or fake activity**:
   - Rooms in prototype mode must be clearly and honestly marked: "Sample Room · Demo".
   - Do not print fake metrics like `±14ms sync` or `38 listeners online` unless powered by real telemetry.
2. **No decorative middle-dot strings (Hallmark Gate 63)**:
   - Avoid `NOCTURNE · LISTENING · SYNC · LOUNGE` style repeated middle-dot marquees.
3. **No emoji icons (Hallmark Gate 30a)**:
   - Icons must come from Lucide SVG icons with proper accessibility labels. Emojis in UI buttons are forbidden.
4. **No fake form submission confirmations**:
   - Modals and actions clearly indicate prototype behavior without deceptive fake success states.

---

## 6. The Hallmark Anti-Slop Audit Checklist

Run before any release:
- [ ] No `transition: all` anywhere in CSS or JSX.
- [ ] No uppercase micro-eyebrows above headings.
- [ ] No `tracking-widest` or `tracking-[0.2em]` on small text.
- [ ] No `font-mono` on non-numerical labels.
- [ ] No cards inside cards.
- [ ] No scaling images on hover.
- [ ] No arbitrary yellow or multi-colored text words in headings.
- [ ] All interactive elements have `:focus-visible` with 3:1 contrast.
- [ ] Canvas visualizer has `aria-hidden="true"`.
- [ ] Zero hardcoded hex colors outside `:root`.
- [ ] `overflow-x: clip` applied to `html` and `body`.
