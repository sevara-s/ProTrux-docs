import React, { useState } from 'react';
import { X, Link2, Check, Lock, Globe, Users } from 'lucide-react';
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-stone-200/90 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900 truncate pr-4">
            Share "{documentTitle || 'Untitled document'}"
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input area */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Add people, emails, or teams"
            className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm placeholder-stone-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all text-stone-800"
          />
        </div>

        {/* People with access */}
        <div className="mb-6">
          <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-3">
            People with real-time access
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {/* Current user */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-xs"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-900">{currentUser.name} (you)</p>
                  <p className="text-xs text-stone-500">Author · Active now</p>
                </div>
              </div>
              <span className="text-xs text-stone-500 font-medium">Owner</span>
            </div>

            {/* Other peers */}
            {collaborators.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-xs"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">{c.name}</p>
                    <p className="text-xs text-stone-500">Collaborator · Live CRDT peer</p>
                  </div>
                </div>
                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">Editor</span>
              </div>
            ))}
          </div>
        </div>

        {/* General Access */}
        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100/70 text-indigo-600 mt-0.5">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-stone-900">Anyone with the link</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Anyone on the internet with this link can view and edit collaboratively
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 py-0.5 px-2 bg-indigo-50 border border-indigo-100 rounded-md">Editor</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Link copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 text-stone-500" />
                <span>Copy document link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
