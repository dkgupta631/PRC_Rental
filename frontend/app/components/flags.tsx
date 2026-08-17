export type FlagProps = { className?: string };

export function FlagGB({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" strokeWidth="4.4" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="2" />
      <path d="M15,0 V20 M0,10 H30" stroke="#fff" strokeWidth="7" />
      <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3" />
    </svg>
  );
}

export function FlagTH({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#A51931" />
      <rect y="3.33" width="30" height="13.34" fill="#fff" />
      <rect y="6.67" width="30" height="6.67" fill="#2D2A4A" />
    </svg>
  );
}

export function FlagKH({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
      <rect width="30" height="20" fill="#032EA1" />
      <rect width="30" height="5" fill="#E00025" />
      <rect y="15" width="30" height="5" fill="#E00025" />
      <rect x="9" y="12" width="12" height="2" fill="#fff" />
      <polygon points="15,5 16.7,12 13.3,12" fill="#fff" />
      <polygon points="11.5,7 13,12 10,12" fill="#fff" />
      <polygon points="18.5,7 20,12 17,12" fill="#fff" />
    </svg>
  );
}
