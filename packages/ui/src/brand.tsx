import type { SVGProps } from "react";

export function MeminiMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <path
        d="M5 24.5V9.2c0-2 2.25-3.15 3.85-1.96L16 12.6l7.15-5.36C24.75 6.05 27 7.2 27 9.2v15.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 24.5V14.2L16 18.3l5.5-4.1v10.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <circle cx="16" cy="5.4" r="1.45" fill="currentColor" />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand" aria-label="MeminiOS">
      <MeminiMark className="brand-mark" />
      {!compact && <span className="brand-word">Memini</span>}
    </span>
  );
}
