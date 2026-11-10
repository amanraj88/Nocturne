# NOCTURNE — Visual Identity & Creative Direction Rules

**Version:** 1.0  
**Status:** Creative Direction Established & Active

## 1. Brand Positioning & Core Concept
NOCTURNE is an independent electronic music culture-inspired social listening platform.
- **Tagline:** Music hits different together.
- **Core Idea:** A digital space where sound becomes visual culture and listening becomes a shared experience.
- The product feels like an independent record project and curated vinyl room, not a conventional SaaS streaming dashboard with dark mode.

---

## 2. Foundations: Mineral / Oxide Colour System

```css
:root {
  /* Core Atmosphere */
  --color-deep-ink: #101514;       /* Deepest obsidian/slate base */
  --color-carbon: #191E1B;         /* Elevated surfaces, docks, transport */
  --color-graphite: #292E2A;       /* Subtle dividers, sleeve borders, rails */
  --color-graphite-subtle: #202622;/* De-emphasized hairline boundaries */

  /* Typographic Ink */
  --color-warm-bone: #E8E4D9;      /* Primary editorial display & titles */
  --color-ash: #92958B;            /* Secondary metadata, subtitles, labels */
  --color-ash-dim: #62665D;        /* Timestamps, de-emphasized captions */

  /* Signal Accents */
  --color-mineral: #A0B7A8;        /* Primary interaction accent, sync, active play */
  --color-mineral-subtle: rgba(160, 183, 168, 0.12);
  --color-mineral-glow: rgba(160, 183, 168, 0.22);

  --color-oxide: #A65D45;          /* Artwork expressive accent, skip votes, mute alert */
  --color-oxide-subtle: rgba(166, 93, 69, 0.12);
}
```

### Contrast Rules
- **Warm Bone on Deep Ink:** 13.2:1 (exceeds AAA for normal text).
- **Mineral on Deep Ink:** 8.1:1 (exceeds AAA for normal text).
- **Ash on Deep Ink:** 5.7:1 (exceeds AA for normal text).
- **Oxide:** Restricted to artwork compositions, active skip vote indicators, and non-text visual accents where contrast is not relied on for body reading.

---

## 3. Typographic System

| Role | Font Family | Weights | Use Cases |
| :--- | :--- | :--- | :--- |
| **Display Headings** | `Syne` (`font-display`) | 700, 800 | Room titles, track hero headlines, release artwork titles |
| **Interface / Body** | `Inter` (`font-sans`) | 400, 500, 600 | Navigation, descriptions, buttons, chat notes, artist names |
| **Telemetry / Digits**| `JetBrains Mono` (`font-mono`) | 400, 500 | Strictly numbers, timestamps (`02:14`), catalog codes (`NOC-01`), drift values (`14`) |

> **Hallmark Reflex 64 Rule:** `font-mono` must NEVER be applied to mixed text containing words (e.g., `SYNC ±14MS`). Labels and units must use `font-sans`; apply `font-mono` exclusively to numeric digits: `Sync ±<span className="font-mono">{driftMs}</span>ms`.

---

## 4. Physical Artefact & Artwork Direction

1. **Original Artwork Only:**
   - **NOC-01 Shibuya Reverie:** Horizontal frequency ribbons, central moiré aperture, tape-shear displacement.
   - **NOC-02 Reykjavik Echoes:** Glacial topographic contours, diagonal escarpment, harmonic negative space.
   - **NOC-03 Kreuzberg Velvet:** Industrial concrete monolith, 12×24 halftone dot matrix, cantilever oxide beam.
   - Pure local vector SVG with zero external CDN dependencies.
2. **Vinyl Sleeve Presentation:**
   - 12" dense cardboard sleeve with precision softened corners (`rounded-[2px]`), authentic spine relief, and uncrowded artwork.
   - Peeking 180g vinyl record with micro-grooves, spindle label, and smooth rotation on active playback.
   - Never obstruct the artwork with heavy UI cards or redundant badges.
3. **Technically Honest Playback & Telemetry:**
   - Never fabricate FFT spectrum analysis from iframe streams.
   - Honest harmonic amplitude monitors reflect playback activity without claiming raw frequency decomposition.
   - Real, client-independent local volume monitor.

---

## 5. Anti-Slop Audit Checklist (Hallmark Standards)

- [x] Zero hardcoded color literals outside CSS variables / design tokens.
- [x] No `transition-all` on interactive buttons; specify `transition-transform`, `transition-colors`, or `transition-opacity`.
- [x] No nested card-in-card containers.
- [x] No uppercase letter-spacing on tiny body text without purpose.
- [x] `overflow-x: clip` on `html`, `body`, and `#next`.
- [x] Strict adherence to `prefers-reduced-motion` and `data-quality="off"` toggle.
