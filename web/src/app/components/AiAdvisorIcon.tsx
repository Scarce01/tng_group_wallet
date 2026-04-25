/**
 * AiAdvisorIcon — original flat-illustration SVG of an analyst persona with
 * two chart "paper" panels behind. No background, no external assets.
 *
 * Used in:
 *   - AiAdvisorDialog header (size ≈ 34)
 *   - PoolPage floating character (size ≈ 56)
 */
export function AiAdvisorIcon({ size = 48, withPapers = true }: { size?: number; withPapers?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AI Advisor"
    >
      {/* Left chart paper */}
      {withPapers && (
        <g transform="translate(4 24) rotate(-8 18 22)">
          <rect x="0" y="0" width="34" height="40" rx="2" fill="#ffffff" stroke="#1a1a1a" strokeWidth="1.4" />
          {/* tape */}
          <rect x="11" y="-3" width="12" height="6" fill="#cbd5e1" opacity="0.85" />
          {/* bars */}
          <rect x="6" y="22" width="6" height="13" fill="#ef4444" stroke="#1a1a1a" strokeWidth="1" />
          <rect x="14" y="14" width="6" height="21" fill="#ffffff" stroke="#1a1a1a" strokeWidth="1" />
          <rect x="22" y="18" width="6" height="17" fill="#fbcfe8" stroke="#1a1a1a" strokeWidth="1" />
          {/* baseline */}
          <line x1="4" y1="35" x2="30" y2="35" stroke="#1a1a1a" strokeWidth="1.2" />
        </g>
      )}

      {/* Right chart paper */}
      {withPapers && (
        <g transform="translate(56 16) rotate(7 17 22)">
          <rect x="0" y="0" width="34" height="40" rx="2" fill="#ffffff" stroke="#1a1a1a" strokeWidth="1.4" />
          <rect x="11" y="-3" width="12" height="6" fill="#cbd5e1" opacity="0.85" />
          <rect x="5" y="20" width="5" height="15" fill="#fbcfe8" stroke="#1a1a1a" strokeWidth="1" />
          <rect x="12" y="12" width="5" height="23" fill="#f97316" stroke="#1a1a1a" strokeWidth="1" />
          <rect x="19" y="22" width="5" height="13" fill="#ef4444" stroke="#1a1a1a" strokeWidth="1" />
          <rect x="26" y="26" width="5" height="9" fill="#16a34a" stroke="#1a1a1a" strokeWidth="1" />
          <line x1="4" y1="35" x2="32" y2="35" stroke="#1a1a1a" strokeWidth="1.2" />
        </g>
      )}

      {/* Body — yellow shirt */}
      <path
        d="M28 86 C 28 70, 38 64, 48 64 C 58 64, 68 70, 68 86 Z"
        fill="#fbbf24"
        stroke="#1a1a1a"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Tablet/clipboard held in front */}
      <rect
        x="38"
        y="68"
        width="22"
        height="18"
        rx="1.5"
        fill="#1f2937"
        stroke="#1a1a1a"
        strokeWidth="1.4"
        transform="rotate(-6 49 77)"
      />

      {/* Neck */}
      <rect x="44" y="56" width="10" height="8" fill="#f4c79a" stroke="#1a1a1a" strokeWidth="1.4" />

      {/* Head — face */}
      <ellipse cx="49" cy="44" rx="14" ry="16" fill="#f4c79a" stroke="#1a1a1a" strokeWidth="1.6" />

      {/* Hair — dark short bob */}
      <path
        d="M35 38 C 33 26, 42 22, 49 22 C 57 22, 65 26, 64 39 C 63 35, 60 33, 55 33 C 50 36, 44 36, 40 33 C 36 33, 35 36, 35 38 Z"
        fill="#1a1a1a"
        stroke="#1a1a1a"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Side hair tufts */}
      <path d="M35 38 C 33 44, 34 50, 36 53 C 37 49, 36 43, 36 40 Z" fill="#1a1a1a" />
      <path d="M63 38 C 65 44, 64 50, 62 53 C 61 49, 62 43, 62 40 Z" fill="#1a1a1a" />

      {/* Eyes */}
      <circle cx="44" cy="44" r="1.6" fill="#1a1a1a" />
      <circle cx="55" cy="44" r="1.6" fill="#1a1a1a" />

      {/* Cheeks */}
      <circle cx="40" cy="49" r="2.3" fill="#fb7185" opacity="0.55" />
      <circle cx="58" cy="49" r="2.3" fill="#fb7185" opacity="0.55" />

      {/* Smile */}
      <path d="M45 51 Q 49 54 53 51" fill="none" stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round" />

      {/* Earring (right) */}
      <circle cx="63" cy="48" r="1.6" fill="#fbbf24" stroke="#1a1a1a" strokeWidth="1" />

      {/* Pointer arm — right side, raised */}
      <path
        d="M65 70 C 72 60, 78 52, 84 46"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M65 70 C 72 60, 78 52, 84 46"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Hand */}
      <circle cx="84" cy="46" r="3" fill="#f4c79a" stroke="#1a1a1a" strokeWidth="1.2" />
    </svg>
  );
}
