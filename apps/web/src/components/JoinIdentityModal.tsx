import React, { useEffect, useRef, useState } from 'react';
import { User } from 'lucide-react';

const IDENTITY_COLORS = [
  '#1f6f5c',
  '#164f42',
  '#0e7490',
  '#1e3a5f',
  '#3f6212',
  '#7c2d12',
  '#4c1d95',
  '#9a3412',
];

interface JoinIdentityModalProps {
  isOpen: boolean;
  initialName?: string;
  initialColor?: string;
  onContinue: (user: { name: string; color: string }) => void;
}

/**
 * First-entry gate: let each collaborator choose a display name + cursor color
 * so peers can tell who is who while editing live.
 */
export const JoinIdentityModal: React.FC<JoinIdentityModalProps> = ({
  isOpen,
  initialName = '',
  initialColor = IDENTITY_COLORS[0],
  onContinue,
}) => {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setColor(initialColor || IDENTITY_COLORS[0]);
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
    return () => window.clearTimeout(t);
  }, [isOpen, initialName, initialColor]);

  if (!isOpen) return null;

  const trimmed = name.trim().slice(0, 40);
  const canContinue = trimmed.length >= 2;

  const submit = () => {
    if (!canContinue) return;
    onContinue({ name: trimmed, color });
  };

  return (
    <div
      className="fixed inset-0 bg-chrome/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fade-scale"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-identity-title"
    >
      <div className="bg-elevated rounded-panel shadow-lift max-w-md w-full p-6 border border-line">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-accent-fg font-bold text-sm"
            style={{ backgroundColor: color }}
          >
            {(trimmed || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent mb-0.5">Join document</p>
            <h3 id="join-identity-title" className="ptx-mark text-2xl text-fg leading-tight">
              What’s your name?
            </h3>
          </div>
        </div>

        <p className="text-sm text-fg-muted leading-relaxed mb-5">
          Others will see this on your live cursor and in the people list while you edit together.
        </p>

        <label className="block mb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-fg-muted mb-1.5 block">
            Display name
          </span>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
            <input
              ref={inputRef}
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              placeholder="e.g. Sevara, Alex, Team Lead…"
              className="ptx-input w-full !pl-10"
              autoComplete="nickname"
            />
          </div>
        </label>

        <div className="mb-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-fg-muted mb-2 block">
            Cursor color
          </span>
          <div className="flex flex-wrap gap-2">
            {IDENTITY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-lg border transition-transform ${
                  color === c ? 'ring-2 ring-accent ring-offset-2 scale-110' : 'border-line hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!canContinue}
          onClick={submit}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-accent text-accent-fg hover:brightness-110 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          Continue to document
        </button>
      </div>
    </div>
  );
};
