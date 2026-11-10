import React from 'react';

export const Noc03Kreuzberg: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="NOC-03: Kreuzberg Concrete Velvet industrial halftone and geometric tension"
      role="img"
    >
      {/* Deep Obsidian Canvas */}
      <rect width="600" height="600" fill="#101514" />

      {/* Structural Foundation Grid (Architectural Elevation Floor) */}
      <rect x="40" y="40" width="520" height="520" fill="#141917" />

      {/* LEFT BRUTALIST CONCRETE MONOLITH */}
      <g>
        <rect x="40" y="40" width="190" height="520" fill="#1C2420" stroke="#292E2A" strokeWidth="1.5" />

        {/* Board-Formed Concrete Formwork Grooves */}
        <g stroke="#141917" strokeWidth="2.5">
          <line x1="40" y1="105" x2="230" y2="105" />
          <line x1="40" y1="170" x2="230" y2="170" />
          <line x1="40" y1="235" x2="230" y2="235" />
          <line x1="40" y1="300" x2="230" y2="300" />
          <line x1="40" y1="365" x2="230" y2="365" />
          <line x1="40" y1="430" x2="230" y2="430" />
          <line x1="40" y1="495" x2="230" y2="495" />
        </g>

        {/* Deep Recessed Shadow Well (Left Border) */}
        <rect x="195" y="40" width="35" height="520" fill="#101514" />
      </g>

      {/* SCREENPRINTED HALFTONE MATRIX (Right Concrete Architectural Field) */}
      <g fill="#292E2A">
        {/* Background Tone Plate */}
        <rect x="350" y="40" width="210" height="520" fill="#171E1B" stroke="#292E2A" strokeWidth="1" />

        {/* Halftone Matrix (Density increases diagonally towards lower center) */}
        {Array.from({ length: 12 }).map((_, col) =>
          Array.from({ length: 24 }).map((_, row) => {
            const cx = 365 + col * 16.5;
            const cy = 60 + row * 20;
            const factor = (col * 0.85 + row * 0.45) / 18;
            const r = Math.max(1.2, Math.min(5.8, 1.2 + factor * 2.4));
            const isLuminous = col > 4 && row > 10 && row < 21;
            return (
              <circle
                key={`ht-v3-${col}-${row}`}
                cx={cx}
                cy={cy}
                r={r}
                fill={isLuminous ? '#92958B' : '#28322D'}
                opacity={isLuminous ? 0.85 : 0.6}
              />
            );
          })
        )}
      </g>

      {/* MONUMENTAL INTERLOCKING OXIDE MONOLITH (#A65D45) */}
      <g>
        {/* Massive Vertical Oxidized Slab */}
        <rect
          x="230"
          y="40"
          width="135"
          height="520"
          fill="#A65D45"
        />

        {/* Heavy Horizontal Cantilever Plate (Punches horizontally across into the halftone field) */}
        <rect
          x="230"
          y="275"
          width="270"
          height="95"
          fill="#A65D45"
        />

        {/* Linear Industrial Grain Patina */}
        <g stroke="#8A4936" strokeWidth="2.5">
          <line x1="250" y1="40" x2="250" y2="560" />
          <line x1="275" y1="40" x2="275" y2="560" strokeDasharray="8 14" />
          <line x1="305" y1="40" x2="305" y2="560" />
          <line x1="335" y1="40" x2="335" y2="560" strokeDasharray="12 12" />
        </g>

        {/* MONUMENTAL ARCHITECTURAL VOIDS (Clean Geometric Negative Cuts) */}
        {/* Upper Monumental Void (Exposes the Deep Obsidian Void) */}
        <rect x="265" y="115" width="100" height="75" fill="#101514" />
        <rect x="275" y="125" width="20" height="55" fill="#171E1B" />

        {/* Lower Negative Shadow Notch */}
        <rect x="265" y="435" width="100" height="65" fill="#101514" />

        {/* Horizontal Plate Deep Shadow Aperture */}
        <rect x="390" y="295" width="85" height="35" fill="#101514" />

        {/* High-Contrast Directional Light Edge Bevels (Warm Bone Highlights) */}
        <line x1="230" y1="40" x2="230" y2="560" stroke="#E8E4D9" strokeWidth="2.5" strokeOpacity="0.85" />
        <line x1="230" y1="275" x2="500" y2="275" stroke="#E8E4D9" strokeWidth="2.5" strokeOpacity="0.85" />
        <line x1="500" y1="275" x2="500" y2="370" stroke="#E8E4D9" strokeWidth="2" strokeOpacity="0.75" />
        <line x1="365" y1="370" x2="500" y2="370" stroke="#101514" strokeWidth="3" />
      </g>

      {/* Structural Anchor Point & Diagonal Tension Meridian */}
      <g stroke="#E8E4D9" strokeWidth="1.5" strokeOpacity="0.7">
        <line x1="365" y1="40" x2="365" y2="275" />
        <line x1="365" y1="370" x2="365" y2="560" />
        <circle cx="500" cy="275" r="4.5" fill="#E8E4D9" />
      </g>
    </svg>
  );
};
