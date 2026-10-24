import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number; sw?: number };

function base({ size = 16, sw = 1.75, className = "", ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
    ...rest,
  };
}

export const HomeIcon = (p: P) => (
  <svg {...base({ sw: 1.8, ...p })}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </svg>
);
export const TokensIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="m16.71 13.88.7.71-2.82 2.82" />
  </svg>
);
export const ShiftsIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M2 15c6.667-6 13.333 0 20-6" />
    <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
    <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
    <path d="m17 6-2.5-2.5M14 8l-1-1M7 18l2.5 2.5M3.5 14.5l.5.5M20 9l.5.5M6.5 12.5l1 1M16.5 10.5l1 1M10 16l1.5 1.5" />
  </svg>
);
export const LaunchIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);
export const DocsIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 7v14" />
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
  </svg>
);
export const XIcon = ({ size = 13, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.9L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
  </svg>
);
export const CollapseIcon = (p: P) => (
  <svg {...base({ size: 12, sw: 2, ...p })}>
    <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" />
  </svg>
);
export const ExpandIcon = (p: P) => (
  <svg {...base({ size: 12, sw: 2, ...p })}>
    <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
  </svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base({ sw: 2, ...p })}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base({ size: 14, sw: 2, ...p })}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);
export const ClockIcon = (p: P) => (
  <svg {...base({ size: 13, sw: 2.4, ...p })}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const ExternalIcon = (p: P) => (
  <svg {...base({ size: 12, sw: 2.4, ...p })}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);
export const UploadIcon = (p: P) => (
  <svg {...base({ size: 20, sw: 2.2, ...p })}>
    <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
  </svg>
);
export const ChevronDown = (p: P) => (
  <svg {...base({ sw: 2, ...p })}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base({ sw: 2, ...p })}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const WalletIcon = (p: P) => (
  <svg {...base({ size: 26, sw: 1.6, ...p })}>
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </svg>
);
export const KeyIcon = (p: P) => (
  <svg {...base({ size: 26, sw: 1.6, ...p })}>
    <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
    <path d="m21 2-9.6 9.6" />
    <circle cx="7.5" cy="15.5" r="5.5" />
  </svg>
);
export const TimerIcon = (p: P) => (
  <svg {...base({ size: 26, sw: 1.6, ...p })}>
    <path d="M10 2h4M12 14l3-3" />
    <circle cx="12" cy="14" r="8" />
  </svg>
);
export const TrendIcon = (p: P) => (
  <svg {...base({ size: 26, sw: 1.6, ...p })}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </svg>
);
export const VoteIcon = (p: P) => (
  <svg {...base({ size: 26, sw: 1.6, ...p })}>
    <path d="m9 12 2 2 4-4" />
    <path d="M5 7h14l1 13H4z" />
    <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
  </svg>
);
export const SolIcon = ({ size = 22, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="11.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path
      fill="currentColor"
      d="M7.3 15.2a.5.5 0 0 1 .35-.15h10.1c.22 0 .33.27.17.43l-1.6 1.6a.5.5 0 0 1-.35.15H5.87a.25.25 0 0 1-.17-.43l1.6-1.6Zm0-7.8a.5.5 0 0 1 .35-.15h10.1c.22 0 .33.27.17.43l-1.6 1.6a.5.5 0 0 1-.35.15H5.87a.25.25 0 0 1-.17-.43l1.6-1.6Zm9.4 3.87a.5.5 0 0 0-.35-.15H6.25a.25.25 0 0 0-.17.43l1.6 1.6c.09.1.22.15.35.15h10.1c.22 0 .33-.27.17-.43l-1.6-1.6Z"
    />
  </svg>
);
export const EthIcon = ({ size = 22, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="11.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path fill="currentColor" d="M12 4.5 7.2 12.4 12 15.2l4.8-2.8L12 4.5Zm0 11.9-4.8-2.8L12 19.5l4.8-5.9L12 16.4Z" />
  </svg>
);
