import { itemById } from "@/lib/hcc/catalog";
import { cn } from "@/lib/utils";

/** Visual identity per badge id — pure presentation. */
const BADGE_STYLE: Record<
  string,
  { short: string; className: string; glyph: string }
> = {
  "badge-rookie": {
    short: "ROOKIE",
    glyph: "◆",
    className: "border-border/70 bg-secondary/40 text-muted-foreground",
  },
  "badge-operator": {
    short: "OPERATOR",
    glyph: "▣",
    className: "border-hud-cyan/50 bg-hud-cyan/10 text-hud-cyan",
  },
  "badge-specialist": {
    short: "SPECIALIST",
    glyph: "⬡",
    className: "border-hud-violet/55 bg-hud-violet/15 text-hud-violet",
  },
  "badge-ghost": {
    short: "GHOST",
    glyph: "◇",
    className: "border-foreground/25 bg-foreground/5 text-foreground/80",
  },
  "badge-blacksite": {
    short: "BLACKSITE",
    glyph: "▣",
    className: "border-hud-red/55 bg-hud-red/10 text-hud-red",
  },
  "badge-elite": {
    short: "ELITE",
    glyph: "★",
    className: "border-hud-amber/60 bg-hud-amber/15 text-hud-amber text-glow",
  },
  "badge-apex": {
    short: "APEX",
    glyph: " cons",
    className:
      "border-hud-green/60 bg-gradient-to-r from-hud-cyan/15 to-hud-green/15 text-hud-green text-glow",
  },
};

export default function OperatorBadge({
  badgeId,
  className,
}: {
  badgeId?: string | null;
  className?: string;
}) {
  const id = badgeId ?? "badge-rookie";
  const item = itemById(id);
  const style = BADGE_STYLE[id] ?? BADGE_STYLE["badge-rookie"]!;
  const title = item?.name?.replace(/^Badge —\s*/i, "") ?? style.short;

  return (
    <span
      title={item?.blurb ?? title}
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] tracking-[0.16em] uppercase",
        style.className,
        className,
      )}
    >
      <span aria-hidden className="text-[10px] leading-none">
        {style.glyph}
      </span>
      <span className="max-w-[7.5rem] truncate">{style.short}</span>
    </span>
  );
}
