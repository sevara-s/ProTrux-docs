import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme-store';

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', compact }) => {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle group relative ${compact ? 'theme-toggle--compact' : ''} ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle__track" aria-hidden>
        <span className={`theme-toggle__thumb ${isDark ? 'theme-toggle__thumb--dark' : ''}`}>
          {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </span>
        <Sun className="theme-toggle__icon theme-toggle__icon--sun" />
        <Moon className="theme-toggle__icon theme-toggle__icon--moon" />
      </span>
      {!compact && (
        <span className="theme-toggle__label">{isDark ? 'Dark' : 'Light'}</span>
      )}
    </button>
  );
};
