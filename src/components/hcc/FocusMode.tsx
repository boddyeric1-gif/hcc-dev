import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type FocusCtx = {
  /** True while an operation puzzle is live on TOOLS. */
  focused: boolean;
  setFocused: (v: boolean) => void;
  /** Optional label shown in the focus chrome (e.g. PORT MAPPER). */
  label: string | null;
  setLabel: (v: string | null) => void;
};

const Ctx = createContext<FocusCtx | null>(null);

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [focused, setFocused] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      focused,
      setFocused,
      label,
      setLabel,
    }),
    [focused, label],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFocusMode(): FocusCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      focused: false,
      setFocused: () => undefined,
      label: null,
      setLabel: () => undefined,
    };
  }
  return ctx;
}

/** Convenience: enter/exit focus with a label in one call. */
export function useFocusControls() {
  const { setFocused, setLabel } = useFocusMode();
  const enter = useCallback(
    (name: string) => {
      setLabel(name);
      setFocused(true);
    },
    [setFocused, setLabel],
  );
  const exit = useCallback(() => {
    setFocused(false);
    setLabel(null);
  }, [setFocused, setLabel]);
  return { enter, exit };
}
