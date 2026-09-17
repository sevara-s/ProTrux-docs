import React from 'react';
import { X } from 'lucide-react';

interface WordCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: number;
  chars: number;
  charsNoSpaces: number;
  pages: number;
  displayLive: boolean;
  onToggleDisplayLive: (val: boolean) => void;
}

export const WordCountModal: React.FC<WordCountModalProps> = ({
  isOpen,
  onClose,
  words,
  chars,
  charsNoSpaces,
  pages,
  displayLive,
  onToggleDisplayLive,
}) => {
  if (!isOpen) return null;

  const rows = [
    { label: 'Pages', value: pages },
    { label: 'Words', value: words.toLocaleString() },
    { label: 'Characters', value: chars.toLocaleString() },
    { label: 'Characters (no spaces)', value: charsNoSpaces.toLocaleString() },
  ];

  return (
    <div className="fixed inset-0 bg-chrome/55 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-scale">
      <div className="bg-elevated rounded-panel shadow-lift max-w-sm w-full p-6 border border-line">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent mb-1">Telemetry</p>
            <h3 className="ptx-mark text-2xl text-fg">Word count</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-fg-muted hover:text-fg rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-0 rounded-xl border border-line overflow-hidden">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between items-center px-4 py-3 border-b border-line last:border-0 bg-muted/30">
              <span className="text-xs text-fg-muted font-medium">{r.label}</span>
              <span className="font-mono text-sm font-bold text-fg">{r.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-fg-soft cursor-pointer select-none">
            <input
              type="checkbox"
              checked={displayLive}
              onChange={(e) => onToggleDisplayLive(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--accent)]"
            />
            <span>Show live HUD</span>
          </label>
          <button type="button" onClick={onClose} className="ptx-btn ptx-btn--accent py-2 px-5">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
