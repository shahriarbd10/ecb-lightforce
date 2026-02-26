export function BallIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 2L5 5L3 12L7.5 19L16.5 19L21 12L19 5L12 2ZM12 8L14.8 10L13.8 13.2H10.2L9.2 10L12 8ZM8 14.5L10.6 16H13.4L16 14.5M7.4 9L9.2 10M16.6 9L14.8 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BootIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M3 16.5V20H21V17C18 17 16 16 14.5 14L13 12V8.5L9 8L8 12L6 13L3 16.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.5 17H10M11.5 17H13M14.5 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function WhistleIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 13.5A4.5 4.5 0 1 0 14 13.5A4.5 4.5 0 0 0 5 13.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M14 13.5H19L21 11.5V8H16L14 10V13.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="9.5" cy="13.5" r="1.4" fill="currentColor" />
    </svg>
  );
}
