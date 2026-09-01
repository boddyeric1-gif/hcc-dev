import { cn } from "@/lib/utils";

/**
 * Official H.C.C mark — H stacked on mirrored C/C forming a hexagonal shield.
 * Matches the provided app icon; pure SVG so it needs no asset pipeline.
 * If /hcc-mark.png is present in public/, BootScreen prefers that image.
 */
export default function HccMark({
  className,
  glow = true,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 140"
      className={cn(glow && "drop-shadow-[0_0_18px_rgba(56,225,255,0.55)]", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="hcc-mark-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7ef0ff" />
          <stop offset="55%" stopColor="#38e1ff" />
          <stop offset="100%" stopColor="#1ab8d4" />
        </linearGradient>
        <filter id="hcc-mark-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* H block */}
      <path
        filter="url(#hcc-mark-soft)"
        fill="url(#hcc-mark-fill)"
        d="M28 8 L52 8 L52 28 L68 28 L68 8 L92 8 L92 58 L68 58 L68 38 L52 38 L52 58 L28 58 Z"
      />

      {/* Left C / right C forming lower shield */}
      <path
        filter="url(#hcc-mark-soft)"
        fill="url(#hcc-mark-fill)"
        d="M18 62 L58 62 L58 78 L42 78 L42 98 L58 98 L58 114 L18 114
           C12 114 8 108 8 100 L8 76 C8 68 12 62 18 62 Z"
      />
      <path
        filter="url(#hcc-mark-soft)"
        fill="url(#hcc-mark-fill)"
        d="M62 62 L102 62 C108 62 112 68 112 76 L112 100 C112 108 108 114 102 114
           L62 114 L62 98 L78 98 L78 78 L62 78 Z"
      />

      {/* Center seam */}
      <rect x="58.5" y="62" width="3" height="52" fill="#0a121b" opacity="0.35" />
    </svg>
  );
}
