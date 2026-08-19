import { useGame } from "@/lib/hcc/store";

/** Room light control for the 3D scenes. */
export default function SceneBrightness() {
  const { state, dispatch } = useGame();
  return (
    <label className="flex items-center gap-2 text-[9px] tracking-[0.16em] text-muted-foreground">
      <span>LIGHT</span>
      <input
        type="range"
        min={0.6}
        max={2.4}
        step={0.05}
        value={state.brightness}
        onChange={(e) => dispatch({ type: "brightness", value: Number(e.target.value) })}
        className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-secondary accent-[var(--hud-cyan,#38e1ff)]"
        aria-label="Scene brightness"
      />
      <span className="w-7 tabular-nums text-hud-cyan">{state.brightness.toFixed(2)}</span>
    </label>
  );
}
