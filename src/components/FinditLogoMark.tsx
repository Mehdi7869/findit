interface FinditLogoMarkProps {
  size?: number;
  withSweep?: boolean;
}

export function FinditLogoMark({ size = 56, withSweep = false }: FinditLogoMarkProps) {
  return (
    <div
      className="relative inline-flex items-center justify-center overflow-hidden rounded-2xl"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="finditRingGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="55%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
          <linearGradient id="finditLensGrad" x1="14" y1="14" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.65" />
          </linearGradient>
        </defs>
        <circle cx="28" cy="28" r="17" fill="url(#finditLensGrad)" stroke="url(#finditRingGrad)" strokeWidth="4.2" />
        <circle cx="28" cy="28" r="12" stroke="#67E8F9" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="3 3" />
        <path d="M28 21V35M21 28H35" stroke="#2DD4BF" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="28" cy="28" r="2.6" fill="#67E8F9" />
        <path d="M40.5 40.5L54 54" stroke="url(#finditRingGrad)" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M40.5 40.5L44.5 44.5" stroke="#E0F2FE" strokeWidth="5.5" strokeLinecap="round" />
      </svg>
      {withSweep && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-cyan-sweep h-full w-1/2 bg-gradient-to-r from-transparent via-cyan-300/65 to-transparent" />
        </div>
      )}
    </div>
  );
}
