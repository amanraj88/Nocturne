import React from 'react';

export const Noc02Reykjavik: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="NOC-02: Reykjavik Obsidian Echoes glacial topographic contours"
      role="img"
    >
      {/* Deep Obsidian Canvas */}
      <rect width="600" height="600" fill="#101514" />

      {/* Tectonic Mass Shading: Subtle Carbon body behind the mountain face */}
      <path
        d="M 40 560 L 40 440 C 120 430, 180 380, 240 360 C 320 330, 390 260, 480 210 C 520 190, 550 200, 560 190 L 560 560 Z"
        fill="#161C19"
      />
      <path
        d="M 120 560 L 120 470 C 190 460, 240 410, 300 390 C 370 360, 430 300, 510 260 C 540 245, 555 250, 560 245 L 560 560 Z"
        fill="#1C2320"
      />

      {/* Atmospheric Acoustic Rings (Radiating in Deep Fjord Basin) */}
      <g stroke="#92958B" strokeWidth="1.5" fill="none">
        <ellipse cx="230" cy="460" rx="60" ry="26" strokeOpacity="0.4" />
        <ellipse cx="230" cy="460" rx="120" ry="52" strokeOpacity="0.25" strokeDasharray="3 6" />
        <ellipse cx="230" cy="460" rx="190" ry="82" strokeOpacity="0.15" />
      </g>

      {/* GLACIAL TOPOGRAPHIC ESCARPMENT (High Contrast Contour Strata) */}
      <g fill="none">
        {/* Deep Baseline Ridge (Graphite) */}
        <path
          d="M 40 500 C 130 490, 200 450, 270 430 C 350 405, 430 350, 520 310 C 545 300, 555 302, 560 300"
          stroke="#292E2A"
          strokeWidth="2.5"
        />

        {/* Contour Terrace 1: Sub-Alpine Shadow Contour */}
        <path
          d="M 40 465 C 130 455, 195 415, 260 395 C 340 370, 420 310, 510 270 C 540 258, 552 260, 560 258"
          stroke="#92958B"
          strokeWidth="2"
          strokeOpacity="0.65"
        />

        {/* Contour Terrace 2: Lower Glacial Steppe */}
        <path
          d="M 40 435 C 130 425, 190 380, 255 360 C 330 335, 410 275, 500 235 C 535 222, 550 226, 560 224"
          stroke="#92958B"
          strokeWidth="2"
          strokeOpacity="0.85"
        />

        {/* Contour Terrace 3: Luminous Ash Shelf */}
        <path
          d="M 40 405 C 125 395, 185 350, 250 330 C 325 305, 400 245, 490 205 C 530 190, 548 194, 560 192"
          stroke="#E8E4D9"
          strokeWidth="2"
          strokeOpacity="0.8"
        />

        {/* PRIMARY SCULPTURAL GLACIAL CREST (Warm Bone Focal Ridge - 3.5px) */}
        <path
          d="M 40 375 C 120 365, 180 320, 245 298 C 320 270, 395 210, 480 170 C 525 152, 545 158, 560 155"
          stroke="#E8E4D9"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Secondary Parallel Crest Echo (Razor Light Ridge) */}
        <path
          d="M 50 360 C 125 350, 182 308, 245 286 C 318 258, 392 200, 475 160 C 518 142, 540 148, 555 146"
          stroke="#E8E4D9"
          strokeWidth="1.5"
          strokeOpacity="0.9"
        />

        {/* Distant Plateau Contour 1 */}
        <path
          d="M 70 330 C 140 322, 195 285, 255 265 C 325 240, 395 185, 470 148 C 510 132, 532 136, 550 135"
          stroke="#92958B"
          strokeWidth="1.75"
          strokeOpacity="0.6"
        />

        {/* Distant Plateau Contour 2 */}
        <path
          d="M 100 295 C 160 288, 210 255, 268 238 C 335 215, 400 165, 465 132 C 500 120, 525 122, 545 120"
          stroke="#92958B"
          strokeWidth="1.25"
          strokeOpacity="0.45"
        />

        {/* High Peak Ridge Line (Subtle Upper Horizon) */}
        <path
          d="M 150 255 C 200 250, 240 225, 290 210 C 350 190, 410 145, 460 118"
          stroke="#292E2A"
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
      </g>

      {/* Topographic Vertical Sound-Survey Meridian Vectors */}
      <g stroke="#92958B" strokeWidth="1" strokeOpacity="0.5">
        <line x1="245" y1="298" x2="245" y2="460" strokeDasharray="2 4" />
        <line x1="395" y1="210" x2="395" y2="400" strokeDasharray="2 4" />
        <line x1="480" y1="170" x2="480" y2="340" strokeDasharray="2 4" />
      </g>

      {/* Minimalist Focal Anchor Crosshairs in Vast Upper-Left Void */}
      <g stroke="#E8E4D9" strokeWidth="1.5" strokeOpacity="0.75">
        {/* Primary Acoustic Survey Crosshair */}
        <line x1="120" y1="95" x2="120" y2="125" />
        <line x1="105" y1="110" x2="135" y2="110" />
        <circle cx="120" cy="110" r="3" fill="#E8E4D9" />

        {/* Minor Distant Harmonic Meridian */}
        <circle cx="210" cy="70" r="2" fill="#92958B" strokeOpacity="0.6" />
      </g>
    </svg>
  );
};
