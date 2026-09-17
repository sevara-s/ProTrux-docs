import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

function readInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('protrux_theme') as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }
  // Always start light — Helix brand is the mint/teal editorial system.
  // Dark is opt-in via the toggle (avoids macOS "dark by default" surprise).
  return 'light';
}

const initial = typeof document !== 'undefined' ? readInitialTheme() : 'light';
if (typeof document !== 'undefined') applyTheme(initial);

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initial,
  setTheme: (theme) => {
    localStorage.setItem('protrux_theme', theme);
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
