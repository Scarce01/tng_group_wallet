/**
 * MainAgentIcon — original flat-illustration SVG of an analyst persona
 * inspecting a receipt/chart with a magnifier, ringed by floating coins,
 * a gear, and a small chart panel as the "background effect".
 *
 * Design choices:
 *   - No solid background fill. The decorative elements (coins, gear,
 *     chart) are the background effect — they sit behind the figure with
 *     reduced opacity.
 *   - `withBackgroundFx` lets callers strip those decorations when the
 *     icon needs to be tiny (e.g. a 28×28 chat header).
 *
 * Used by:
 *   - App.tsx home header — Main Agent open button
 *   - MainAgentChat.tsx — chat header
 */
export function MainAgentIcon({
  size = 56,
  withBackgroundFx = true,
}: {
  size?: number;
  withBackgroundFx?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Main Agent"
    >
      {/* ─────────────── Background effect (coins / gear / chart) ─────────────── */}
      {withBackgroundFx && (
        <g opacity="0.65">
          {/* Big coin top-right */}
          <g transform="translate(82 16)">
            <circle cx="10" cy="10" r="10" fill="#A5B4FC" />
            <circle cx="10" cy="10" r="7" fill="none" stroke="#4F46E5" strokeWidth="1.4" opacity="0.5" />
            <text x="10" y="14" fontSize="10" fontFamily="Inter, sans-serif"
              fontWeight="800" fill="#4F46E5" textAnchor="middle">$</text>
          </g>

          {/* Small coin top-left of coin cluster */}
          <g transform="translate(98 38)">
            <circle cx="6" cy="6" r="6" fill="#C7D2FE" />
            <text x="6" y="9" fontSize="7" fontFamily="Inter, sans-serif"
              fontWeight="800" fill="#4F46E5" textAnchor="middle">$</text>
          </g>

          {/* Coin bottom-left */}
          <g transform="translate(8 60)">
            <circle cx="9" cy="9" r="9" fill="#A5B4FC" />
            <text x="9" y="13" fontSize="9" fontFamily="Inter, sans-serif"
              fontWeight="800" fill="#4F46E5" textAnchor="middle">$</text>
          </g>

          {/* Tiny coin bottom-far-left */}
          <g transform="translate(2 92)">
            <circle cx="5" cy="5" r="5" fill="#C7D2FE" />
            <text x="5" y="8" fontSize="6" fontFamily="Inter, sans-serif"
              fontWeight="800" fill="#4F46E5" textAnchor="middle">$</text>
          </g>

          {/* Gear top-left */}
          <g transform="translate(8 18)">
            <circle cx="9" cy="9" r="5" fill="none" stroke="#A5B4FC" strokeWidth="1.6" />
            <circle cx="9" cy="9" r="2" fill="#A5B4FC" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <rect
                key={deg}
                x="8" y="0.5" width="2" height="3" fill="#A5B4FC"
                transform={`rotate(${deg} 9 9)`}
              />
            ))}
          </g>

          {/* Tiny gear behind big gear */}
          <g transform="translate(28 8)">
            <circle cx="6" cy="6" r="3" fill="none" stroke="#C7D2FE" strokeWidth="1.2" />
            <circle cx="6" cy="6" r="1.2" fill="#C7D2FE" />
          </g>

          {/* Small upward chart bottom-right */}
          <g transform="translate(80 78)">
            <polyline
              points="0,18 6,12 12,16 18,8 24,10 30,2"
              fill="none" stroke="#A5B4FC" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
            />
            {/* arrowhead */}
            <path d="M27 4 L31 1 L31 5 Z" fill="#A5B4FC" />
            {[0, 6, 12, 18, 24, 30].map((x, i) => (
              <circle key={i} cx={x} cy={[18, 12, 16, 8, 10, 2][i]} r="1.6" fill="#4F46E5" />
            ))}
          </g>

          {/* Sparkle stars */}
          <path d="M50 6 L52 11 L57 12 L52 13 L50 18 L48 13 L43 12 L48 11 Z"
            fill="#C7D2FE" opacity="0.8" />
          <path d="M104 70 L105.5 73 L108.5 73.7 L105.5 74.4 L104 77.4 L102.5 74.4 L99.5 73.7 L102.5 73 Z"
            fill="#C7D2FE" opacity="0.8" />
          <path d="M30 96 L31.2 98.5 L33.7 99 L31.2 99.6 L30 102 L28.8 99.6 L26.3 99 L28.8 98.5 Z"
            fill="#C7D2FE" opacity="0.8" />
        </g>
      )}

      {/* ─────────────── Receipt / chart panel (held in left hand) ─────────────── */}
      <g transform="translate(58 50)">
        {/* Main paper */}
        <path
          d="M0 0 L36 0 L36 44 L34 46 L30 44 L26 46 L22 44 L18 46 L14 44 L10 46 L6 44 L2 46 L0 44 Z"
          fill="#ffffff"
          stroke="#1E1B4B"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Header bar */}
        <rect x="4" y="4" width="20" height="3" rx="1" fill="#C7D2FE" />
        {/* Mini bar chart */}
        <rect x="4" y="22" width="4" height="14" fill="#A5B4FC" />
        <rect x="10" y="16" width="4" height="20" fill="#6366F1" />
        <rect x="16" y="20" width="4" height="16" fill="#A5B4FC" />
        <rect x="22" y="14" width="4" height="22" fill="#4F46E5" />
        {/* Baseline */}
        <line x1="3" y1="36" x2="33" y2="36" stroke="#1E1B4B" strokeWidth="1" />
      </g>

      {/* ─────────────── Body — purple sweater ─────────────── */}
      <path
        d="M30 110
           C 30 88, 42 80, 56 80
           C 70 80, 84 88, 84 110 Z"
        fill="#6366F1"
        stroke="#1E1B4B"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Sweater collar / blouse showing */}
      <path
        d="M50 80 L56 86 L62 80 L60 84 L56 90 L52 84 Z"
        fill="#ffffff"
        stroke="#1E1B4B"
        strokeWidth="1.2"
      />

      {/* Right arm holding paper (extends to receipt) */}
      <path
        d="M70 86 C 78 78, 80 70, 78 64"
        fill="none"
        stroke="#6366F1"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="78" cy="62" r="3.2" fill="#F4C79A" stroke="#1E1B4B" strokeWidth="1" />

      {/* Left arm holding magnifier (extends up + right toward chart) */}
      <path
        d="M44 84 C 50 70, 58 60, 66 56"
        fill="none"
        stroke="#6366F1"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="66" cy="55" r="3.2" fill="#F4C79A" stroke="#1E1B4B" strokeWidth="1" />

      {/* ─────────────── Magnifier ─────────────── */}
      <g transform="translate(54 38)">
        <circle cx="10" cy="10" r="9" fill="rgba(255,255,255,0.85)" stroke="#1E1B4B" strokeWidth="1.8" />
        <circle cx="10" cy="10" r="5.5" fill="none" stroke="#A5B4FC" strokeWidth="1.4" />
        {/* Handle */}
        <rect x="16" y="16" width="4" height="10" rx="1.4" fill="#1E1B4B" transform="rotate(40 18 21)" />
      </g>

      {/* ─────────────── Neck ─────────────── */}
      <rect x="50" y="68" width="12" height="14" fill="#F4C79A" stroke="#1E1B4B" strokeWidth="1.4" />

      {/* ─────────────── Head ─────────────── */}
      <ellipse cx="56" cy="50" rx="16" ry="18" fill="#F4C79A" stroke="#1E1B4B" strokeWidth="1.6" />

      {/* Hair — long dark with side locks */}
      <path
        d="M40 44
           C 38 28, 48 20, 56 20
           C 66 20, 76 26, 74 46
           C 70 38, 64 36, 58 38
           C 52 40, 46 38, 42 36
           C 40 38, 39 41, 40 44 Z"
        fill="#1E1B4B"
        stroke="#1E1B4B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Side hair tuft (left, longer) */}
      <path d="M40 44 C 36 56, 36 68, 40 76 C 41 68, 40 56, 41 48 Z" fill="#1E1B4B" />
      {/* Side hair tuft (right, shorter) */}
      <path d="M74 46 C 76 54, 75 62, 72 66 C 71 60, 73 52, 73 48 Z" fill="#1E1B4B" />

      {/* Glasses — round frames */}
      <circle cx="50" cy="49" r="4.6" fill="rgba(255,255,255,0.55)" stroke="#1E1B4B" strokeWidth="1.4" />
      <circle cx="62" cy="49" r="4.6" fill="rgba(255,255,255,0.55)" stroke="#1E1B4B" strokeWidth="1.4" />
      <line x1="54.6" y1="49" x2="57.4" y2="49" stroke="#1E1B4B" strokeWidth="1.4" />

      {/* Eyes (behind glasses) */}
      <circle cx="50" cy="49" r="1.2" fill="#1E1B4B" />
      <circle cx="62" cy="49" r="1.2" fill="#1E1B4B" />

      {/* Mouth — small pondering */}
      <path d="M53 60 Q 56 61.5 59 60" fill="none" stroke="#1E1B4B" strokeWidth="1.3" strokeLinecap="round" />

      {/* Earring */}
      <circle cx="72" cy="54" r="1.4" fill="#A5B4FC" stroke="#1E1B4B" strokeWidth="0.8" />
    </svg>
  );
}
