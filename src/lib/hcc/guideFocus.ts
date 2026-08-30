/**
 * One-shot hand-off so a contextual tip can ask the GUIDE tab to open a
 * specific chapter. Deliberately tiny and outside game state: it holds a UI
 * intent, never progression.
 */
let pending: string | null = null;

export const requestGuideChapter = (id: string): void => {
  pending = id;
};

export const takeGuideChapter = (): string | null => {
  const id = pending;
  pending = null;
  return id;
};
