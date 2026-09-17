import React, { useState } from 'react';
import { X, Link2, Check, Hexagon, Lock, Eye, Pencil } from 'lucide-react';
import {
  DOCUMENT_ACCESS_OPTIONS,
  DocumentAccessMode,
  UserPresence,
} from '@protrux/shared';
import { updateDocument } from '@/services/api';
import { useDocumentStore } from '@/store/document-store';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentId: string;
  collaborators: UserPresence[];
  currentUser: { name: string; color: string };
}

const ACCESS_ICONS: Record<DocumentAccessMode, React.ReactNode> = {
  private: <Lock className="w-4 h-4" />,
  view: <Eye className="w-4 h-4" />,
  edit: <Pencil className="w-4 h-4" />,
};

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentId,
  collaborators,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessMode = useDocumentStore((s) => s.accessMode);
  const isOwner = useDocumentStore((s) => s.isOwner);
  const shareToken = useDocumentStore((s) => s.shareToken);
  const updateDocAccess = useDocumentStore((s) => s.updateDocAccess);

  if (!isOpen) return null;

  const buildShareUrl = () => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    params.set('doc', documentId);
    if (shareToken && accessMode !== 'private') {
      params.set('k', shareToken);
    }
    url.hash = params.toString();
    return url.toString();
  };

  const handleCopy = async () => {
    if (accessMode === 'private') {
      setError('Switch to View or Edit so others can open the link.');
      return;
    }
    try {
      await navigator.clipboard.writeText(buildShareUrl());
      setCopied(true);
      setError(null);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy link');
    }
  };

  const handleAccessChange = async (next: DocumentAccessMode) => {
    if (!isOwner || next === accessMode || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateDocument(documentId, { accessMode: next });
      updateDocAccess(documentId, next, updated.shareToken);
      useDocumentStore.getState().setAccessState({
        accessMode: next,
        canEdit: updated.canEdit ?? (isOwner || next === 'edit'),
        shareToken: updated.shareToken ?? shareToken,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access');
    } finally {
      setSaving(false);
    }
  };

  const guestLabel =
    accessMode === 'view' ? 'View' : accessMode === 'edit' ? 'Edit' : 'Blocked';

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-chrome/55 p-4 pt-16 pb-8 backdrop-blur-md sm:items-center sm:pt-8 animate-fade-scale">
      <div className="bg-elevated relative my-auto w-full max-w-md overflow-visible rounded-panel border border-line p-6 pt-7 shadow-lift">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0 pt-0.5">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">Share</p>
            <h3 className="ptx-mark pr-2 text-2xl leading-[1.25] text-fg">
              Share “{documentTitle || 'Untitled document'}”
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-fg-muted hover:bg-muted hover:text-fg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-5">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-fg-muted mb-2">
            General access
          </h4>
          <div className="space-y-2">
            {DOCUMENT_ACCESS_OPTIONS.map((opt) => {
              const selected = accessMode === opt.id;
              const disabled = !isOwner || saving;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => void handleAccessChange(opt.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border transition-colors ${
                    selected
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-surface hover:border-border-strong'
                  } ${disabled && !selected ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 shrink-0 ${selected ? 'text-accent' : 'text-fg-muted'}`}
                    >
                      {ACCESS_ICONS[opt.id]}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${selected ? 'text-accent' : 'text-fg'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-fg-muted mt-0.5 leading-snug">{opt.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {!isOwner && (
            <p className="text-[11px] text-fg-muted mt-2">
              Only the document owner can change access.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={accessMode === 'private'}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl transition-all mb-2 ${
            accessMode === 'private'
              ? 'bg-muted text-fg-muted cursor-not-allowed'
              : 'bg-chrome text-chrome-fg hover:brightness-110'
          }`}
        >
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            {copied ? <Check className="w-4 h-4 text-accent" /> : <Link2 className="w-4 h-4 text-accent" />}
            {accessMode === 'private'
              ? 'Link sharing off'
              : copied
                ? 'Link copied'
                : 'Copy document link'}
          </span>
          <Hexagon className="w-4 h-4 text-accent/70" />
        </button>
        {error && <p className="text-[11px] text-accent mb-4">{error}</p>}
        {!error && <div className="mb-4" />}

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
                <p className="text-[11px] text-fg-muted">
                  {isOwner ? 'Owner · full access' : 'Guest · active'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase text-accent">
              {isOwner ? 'Owner' : guestLabel}
            </span>
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
              <span className="text-[10px] font-mono uppercase text-fg-muted">{guestLabel}</span>
            </div>
          ))}
          {collaborators.length === 0 && (
            <p className="text-xs text-fg-muted py-2 leading-relaxed">
              No peers yet. Set access to View or Edit, copy the link, and open it in another tab.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
