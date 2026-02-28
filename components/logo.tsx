interface LogoProps {
  className?: string
}

export function Logo({ className = "h-12 w-12" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Condo Platform"
    >
      {/* Dark rounded-square background */}
      <rect width="200" height="200" rx="40" fill="#0f0d1f" />

      {/* Left building */}
      <rect x="26" y="92" width="46" height="88" rx="5" fill="#3730a3" />
      <rect x="33" y="102" width="12" height="8" rx="2" fill="#1e1b4b" />
      <rect x="51" y="102" width="12" height="8" rx="2" fill="#a5b4fc" />
      <rect x="33" y="117" width="12" height="8" rx="2" fill="#a5b4fc" />
      <rect x="51" y="117" width="12" height="8" rx="2" fill="#1e1b4b" />
      <rect x="33" y="132" width="12" height="8" rx="2" fill="#1e1b4b" />
      <rect x="51" y="132" width="12" height="8" rx="2" fill="#a5b4fc" />

      {/* Right building */}
      <rect x="128" y="100" width="46" height="80" rx="5" fill="#3730a3" />
      <rect x="135" y="110" width="12" height="8" rx="2" fill="#a5b4fc" />
      <rect x="153" y="110" width="12" height="8" rx="2" fill="#1e1b4b" />
      <rect x="135" y="125" width="12" height="8" rx="2" fill="#1e1b4b" />
      <rect x="153" y="125" width="12" height="8" rx="2" fill="#a5b4fc" />

      {/* Main center building */}
      <rect x="66" y="40" width="68" height="140" rx="6" fill="#ffffff" />

      {/* Windows — row 1 */}
      <rect x="76" y="55" width="14" height="10" rx="2" fill="#312e81" />
      <rect x="93" y="55" width="14" height="10" rx="2" fill="#818cf8" />
      <rect x="110" y="55" width="14" height="10" rx="2" fill="#312e81" />
      {/* Windows — row 2 */}
      <rect x="76" y="74" width="14" height="10" rx="2" fill="#818cf8" />
      <rect x="93" y="74" width="14" height="10" rx="2" fill="#312e81" />
      <rect x="110" y="74" width="14" height="10" rx="2" fill="#818cf8" />
      {/* Windows — row 3 */}
      <rect x="76" y="93" width="14" height="10" rx="2" fill="#312e81" />
      <rect x="93" y="93" width="14" height="10" rx="2" fill="#818cf8" />
      <rect x="110" y="93" width="14" height="10" rx="2" fill="#312e81" />
      {/* Windows — row 4 */}
      <rect x="76" y="112" width="14" height="10" rx="2" fill="#818cf8" />
      <rect x="93" y="112" width="14" height="10" rx="2" fill="#312e81" />
      <rect x="110" y="112" width="14" height="10" rx="2" fill="#818cf8" />

      {/* Door */}
      <rect x="86" y="150" width="28" height="30" rx="4" fill="#312e81" />

      {/* Ground line */}
      <rect x="16" y="179" width="168" height="3" rx="1.5" fill="#3730a3" />
    </svg>
  )
}
