import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useDialogStore } from '@/store/dialog-store';

/**
 * Single reusable dialog for confirm / prompt / alert.
 * Driven by dialog-store promise helpers — never use window.confirm/prompt/alert.
 */
export const AppDialog: React.FC = () => {
  const open = useDialogStore((s) => s.open);
  const mode = useDialogStore((s) => s.mode);
  const title = useDialogStore((s) => s.title);
  const message = useDialogStore((s) => s.message);
  const placeholder = useDialogStore((s) => s.placeholder);
  const confirmLabel = useDialogStore((s) => s.confirmLabel);
  const cancelLabel = useDialogStore((s) => s.cancelLabel);
  const danger = useDialogStore((s) => s.danger);
  const inputType = useDialogStore((s) => s.inputType);
  const inputValue = useDialogStore((s) => s.inputValue);
  const setInputValue = useDialogStore((s) => s.setInputValue);
  const confirm = useDialogStore((s) => s.confirm);
  const cancel = useDialogStore((s) => s.cancel);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'prompt') {
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
      return () => window.clearTimeout(t);
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, cancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-chrome/55 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-scale"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div className="bg-elevated rounded-panel shadow-lift max-w-md w-full p-6 border border-line">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent mb-1">
              {mode === 'prompt' ? 'Input' : mode === 'alert' ? 'Notice' : 'Confirm'}
            </p>
            <h3 id="app-dialog-title" className="ptx-mark text-2xl text-fg leading-tight pr-2">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={cancel}
            className="p-1.5 text-fg-muted hover:text-fg rounded-lg hover:bg-muted shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {message ? <p className="text-sm text-fg-muted leading-relaxed mb-5">{message}</p> : null}

        {mode === 'prompt' && (
          <form
            className="mb-5"
            onSubmit={(e) => {
              e.preventDefault();
              confirm();
            }}
          >
            <input
              ref={inputRef}
              type={inputType === 'url' ? 'url' : 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              className="ptx-input w-full"
              autoComplete="off"
            />
          </form>
        )}

        <div className="flex items-center justify-end gap-2">
          {mode !== 'alert' && (
            <button
              type="button"
              onClick={cancel}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-line text-fg-soft hover:bg-muted transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={confirm}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              danger
                ? 'bg-ink text-chrome-fg hover:brightness-110'
                : 'bg-accent text-accent-fg hover:brightness-110'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
