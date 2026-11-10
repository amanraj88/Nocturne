import React from 'react';

export const Noc01Shibuya: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="NOC-01: Shibuya Midnight Reverie abstract frequency ribbons"
      role="img"
    >
      {/* Deep Obsidian Canvas */}
      <rect width="600" height="600" fill="#101514" />

      {/* Atmospheric Spatial Cadence (Fine Vertical Meridian Lines) */}
      <g stroke="#18201D" strokeWidth="1">
        <line x1="100" y1="30" x2="100" y2="570" />
        <line x1="220" y1="30" x2="220" y2="570" strokeDasharray="3 8" opacity="0.5" />
        <line x1="380" y1="30" x2="380" y2="570" strokeDasharray="3 8" opacity="0.5" />
        <line x1="500" y1="30" x2="500" y2="570" />
      </g>

      {/* Ambient Harmonic Decay Strata (Upper Register) */}
      <g stroke="#1F2824" strokeWidth="1.2" fill="none">
        <path d="M 0 75 Q 150 65, 300 78 T 600 70" opacity="0.4" />
        <path d="M 0 105 Q 180 115, 320 100 T 600 110" opacity="0.5" />
        <path d="M 0 135 Q 160 125, 310 140 T 600 130" opacity="0.7" />
        <path d="M 0 165 Q 200 180, 340 160 T 600 172" stroke="#292E2A" strokeWidth="1.5" />
        <path d="M 0 195 Q 170 185, 330 200 T 600 190" stroke="#A0B7A8" strokeWidth="1" strokeOpacity="0.25" />
      </g>

      {/* Sub-Bass Strata (Lower Register) */}
      <g stroke="#1F2824" strokeWidth="1.2" fill="none">
        <path d="M 0 405 Q 220 395, 350 415 T 600 400" stroke="#A0B7A8" strokeWidth="1" strokeOpacity="0.25" />
        <path d="M 0 435 Q 160 445, 330 425 T 600 440" stroke="#292E2A" strokeWidth="1.5" />
        <path d="M 0 465 Q 210 455, 360 475 T 600 460" opacity="0.7" />
        <path d="M 0 495 Q 180 505, 320 490 T 600 500" opacity="0.5" />
        <path d="M 0 525 Q 150 515, 300 530 T 600 520" opacity="0.4" />
      </g>

      {/* MONUMENTAL CENTRAL FREQUENCY CORRIDOR */}
      <g fill="none">
        {/* Shadow Underlay Plane */}
        <path
          d="M 0 280 C 150 210, 240 360, 360 270 C 460 200, 520 340, 600 280 L 600 330 C 520 390, 460 250, 360 320 C 240 410, 150 260, 0 330 Z"
          fill="#191F1C"
          opacity="0.9"
        />

        {/* Heavy Deep-Tone Bass Wave (Graphite) */}
        <path
          d="M 0 265 C 140 195, 230 345, 345 260 C 450 190, 520 325, 600 260"
          stroke="#292E2A"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Primary Mineral Signal Wave */}
        <path
          d="M 0 278 C 145 210, 235 355, 350 272 C 455 202, 525 335, 600 274"
          stroke="#A0B7A8"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Forward Harmonic Ribbon Stack */}
        <path
          d="M 0 288 C 150 224, 240 364, 355 282 C 460 214, 530 344, 600 285"
          stroke="#A0B7A8"
          strokeWidth="2.5"
          strokeOpacity="0.95"
        />
        <path
          d="M 0 295 C 155 234, 245 372, 360 292 C 465 224, 535 352, 600 294"
          stroke="#E8E4D9"
          strokeWidth="2"
          strokeOpacity="0.95"
        />
        <path
          d="M 0 302 C 160 244, 250 380, 365 301 C 470 234, 540 360, 600 302"
          stroke="#A0B7A8"
          strokeWidth="3"
          strokeOpacity="0.85"
        />
        <path
          d="M 0 310 C 165 254, 255 388, 370 310 C 475 244, 545 368, 600 311"
          stroke="#A0B7A8"
          strokeWidth="1.5"
          strokeOpacity="0.7"
        />
        <path
          d="M 0 318 C 170 264, 260 396, 375 319 C 480 254, 550 376, 600 320"
          stroke="#92958B"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />

        {/* Counter-Phase Moiré Wavefield (Generates central optical moiré diamond) */}
        <path
          d="M 0 335 C 150 395, 240 245, 350 330 C 455 405, 530 260, 600 330"
          stroke="#A0B7A8"
          strokeWidth="3.5"
          strokeOpacity="0.9"
        />
        <path
          d="M 0 326 C 145 385, 235 238, 345 321 C 450 395, 525 252, 600 320"
          stroke="#E8E4D9"
          strokeWidth="1.8"
          strokeOpacity="0.95"
        />
        <path
          d="M 0 318 C 140 375, 230 230, 340 312 C 445 385, 520 244, 600 310"
          stroke="#A0B7A8"
          strokeWidth="2.5"
          strokeOpacity="0.8"
        />
        <path
          d="M 0 308 C 135 365, 225 222, 335 302 C 440 375, 515 236, 600 300"
          stroke="#292E2A"
          strokeWidth="4"
        />
      </g>

      {/* ARCHITECTURAL TAPE-SHEAR DISPLACEMENTS (Controlled Phase Steps) */}
      {/* Left Phase Cut */}
      <g>
        <rect x="180" y="210" width="80" height="180" fill="#101514" stroke="#292E2A" strokeWidth="1" />
        <path d="M 180 245 L 260 265" stroke="#A0B7A8" strokeWidth="3.5" />
        <path d="M 180 262 L 260 282" stroke="#E8E4D9" strokeWidth="2" />
        <path d="M 180 276 L 260 296" stroke="#A0B7A8" strokeWidth="1.5" strokeOpacity="0.75" />
        <path d="M 180 294 L 260 314" stroke="#292E2A" strokeWidth="3" />
        <path d="M 180 312 L 260 332" stroke="#A0B7A8" strokeWidth="2.5" strokeOpacity="0.85" />
        <path d="M 180 330 L 260 350" stroke="#191F1C" strokeWidth="4" />
      </g>

      {/* Right Counter Phase Cut */}
      <g>
        <rect x="360" y="215" width="90" height="175" fill="#101514" stroke="#A0B7A8" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="360" y1="245" x2="450" y2="245" stroke="#E8E4D9" strokeWidth="3" />
        <line x1="360" y1="258" x2="450" y2="258" stroke="#A0B7A8" strokeWidth="2" />
        <line x1="360" y1="272" x2="450" y2="272" stroke="#292E2A" strokeWidth="4.5" />
        <line x1="360" y1="288" x2="450" y2="288" stroke="#A0B7A8" strokeWidth="2.5" />
        <line x1="360" y1="302" x2="450" y2="302" stroke="#E8E4D9" strokeWidth="1.5" strokeDasharray="4 4" />
        <line x1="360" y1="318" x2="450" y2="318" stroke="#A0B7A8" strokeWidth="2" strokeOpacity="0.8" />
        <line x1="360" y1="334" x2="450" y2="334" stroke="#191F1C" strokeWidth="3" />
      </g>

      {/* CENTRAL OPTICAL FOCAL APERTURE */}
      <g>
        <circle cx="305" cy="302" r="9" fill="#E8E4D9" />
        <circle cx="305" cy="302" r="20" stroke="#A0B7A8" strokeWidth="2" fill="none" />
        <circle cx="305" cy="302" r="38" stroke="#A0B7A8" strokeWidth="1.2" strokeDasharray="3 5" strokeOpacity="0.75" fill="none" />
      </g>
    </svg>
  );
};
