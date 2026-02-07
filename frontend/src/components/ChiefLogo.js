export default function ChiefLogo({ size = 32, className = "" }) {
  const h = size * 1.06;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 32 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield body — glass gradient fill */}
      <path
        d="M16 2L28 7.5V18.5C28 25.5 22.5 30.5 16 33C9.5 30.5 4 25.5 4 18.5V7.5L16 2Z"
        fill="url(#chief-fill)"
        stroke="url(#chief-stroke)"
        strokeWidth="1.2"
      />
      {/* Command chevron — decisive upward action */}
      <path
        d="M11 20L16 14L21 20"
        stroke="#60A5FA"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Decision anchor — autonomy point */}
      <circle cx="16" cy="25" r="1.4" fill="#60A5FA" opacity="0.65" />
      <defs>
        <linearGradient id="chief-fill" x1="16" y1="2" x2="16" y2="33" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(59,130,246,0.14)" />
          <stop offset="1" stopColor="rgba(59,130,246,0.02)" />
        </linearGradient>
        <linearGradient id="chief-stroke" x1="16" y1="2" x2="16" y2="33" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(96,165,250,0.55)" />
          <stop offset="1" stopColor="rgba(59,130,246,0.1)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
