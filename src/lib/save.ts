// A tiny save: which chapter you have reached and your best finishing time.
// Storage can be blocked (private windows, some embeds), so every access is wrapped and failure is silent.
const KEY = 'staying-warm-v1';
export interface Save { chapter: number; best: number }

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<Save>;
      return { chapter: Math.max(0, Math.min(3, s.chapter ?? 0)), best: s.best ?? 0 };
    }
  } catch { /* storage unavailable */ }
  return { chapter: 0, best: 0 };
}

export function writeSave(patch: Partial<Save>): Save {
  const next = { ...loadSave(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  return next;
}
