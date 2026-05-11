type LogoProps = {
  size?: number;
  className?: string;
  title?: string;
};

export default function Logo({ size = 32, className = "", title = "Task Tutor" }: LogoProps) {
  const gradientId = `tt-brand-${size}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9b82fc" />
          <stop offset="100%" stopColor="#6a4ce0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${gradientId})`} />
      <path d="M32 14 L54 24 L32 34 L10 24 Z" fill="#ffffff" />
      <path
        d="M22 30 L22 40 Q22 44 32 44 Q42 44 42 40 L42 30"
        fill="#ffffff"
        fillOpacity="0.35"
      />
      <path
        d="M22 30 L22 40 Q22 44 32 44 Q42 44 42 40 L42 30"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M50 24 L50 37" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="39.5" r="2.75" fill="#ffffff" />
    </svg>
  );
}
