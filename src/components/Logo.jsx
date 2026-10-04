/** Monogram: an "N" drawn as a tiny neural network (nodes + edges). */
export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF7A1A" />
          <stop offset="1" stopColor="#FFB547" />
        </linearGradient>
      </defs>
      <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="11" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />
      <path d="M11 29V11L29 29V11" stroke="url(#logo-grad)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="11" r="3" fill="currentColor" />
      <circle cx="11" cy="29" r="3" fill="url(#logo-grad)" />
      <circle cx="20" cy="20" r="2.4" fill="currentColor" />
      <circle cx="29" cy="29" r="3" fill="currentColor" />
      <circle cx="29" cy="11" r="3" fill="url(#logo-grad)" />
    </svg>
  )
}
