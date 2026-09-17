import React, { useState } from 'react';
import { X, Link2, Check, Hexagon } from 'lucide-react';
import { UserPresence } from '@protrux/shared';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  collaborators: UserPresence[];
  currentUser: { name: string; color: string };
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  collaborators,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-chrome/55 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-scale">
      <div className="bg-elevated rounded-panel shadow-lift max-w-md w-full p-6 border border-line">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent mb-1">Share</p>
            <h3 className="ptx-mark text-2xl text-fg leading-tight pr-4">
              Share “{documentTitle || 'Untitled document'}”
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-fg-muted hover:text-fg rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-chrome text-chrome-fg hover:brightness-110 transition-all mb-6"
        >
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            {copied ? <Check className="w-4 h-4 text-accent" /> : <Link2 className="w-4 h-4 text-accent" />}
            {copied ? 'Link copied' : 'Copy document link'}
          </span>
          <Hexagon className="w-4 h-4 text-accent/70" />
        </button>

        <h4 className="font-mono text-[10px] uppercase tracking-widest text-fg-muted mb-3">People here</h4>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-accent-fg text-xs font-bold"
                style={{ backgroundColor: currentUser.color }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">{currentUser.name} (you)</p>
                <p className="text-[11px] text-fg-muted">Author · active</p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase text-accent">Owner</span>
          </div>
          {collaborators.map((c) => (
            <div key={c.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-accent-fg text-xs font-bold"
                  style={{ backgroundColor: c.color }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-fg">{c.name}</p>
                  <p className="text-[11px] text-fg-muted">Peer · live cursor</p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase text-fg-muted">Edit</span>
            </div>
          ))}
          {collaborators.length === 0 && (
            <p className="text-xs text-fg-muted py-2 leading-relaxed">
              No peers yet. Open this link in another tab (or Incognito). Each tab gets its own name —
              or pick one under <strong className="text-fg">You ·</strong> in the header.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
