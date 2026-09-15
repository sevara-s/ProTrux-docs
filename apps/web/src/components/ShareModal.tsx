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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-[#dadce0] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#dadce0]">
          <h3 className="text-xl font-normal text-[#202124] truncate pr-4">
            Share "{documentTitle || 'Untitled document'}"
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5f6368] hover:text-[#202124] rounded-full hover:bg-[#f1f3f4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input area */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Add people, groups, and calendar events"
            className="w-full px-4 py-2.5 border border-[#dadce0] rounded-lg text-sm placeholder-[#5f6368] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
          />
        </div>

        {/* People with access */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider mb-3">
            People with real-time access
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {/* Current user */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#202124]">{currentUser.name} (you)</p>
                  <p className="text-xs text-[#5f6368]">Owner · Active now</p>
                </div>
              </div>
              <span className="text-xs text-[#5f6368] font-medium">Owner</span>
            </div>

            {/* Other peers */}
            {collaborators.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#202124]">{c.name}</p>
                    <p className="text-xs text-[#5f6368]">Collaborator · Live CRDT peer</p>
                  </div>
                </div>
                <span className="text-xs text-[#1a73e8] font-medium">Editor</span>
              </div>
            ))}
          </div>
        </div>

        {/* General Access */}
        <div className="p-3 bg-[#f8fafd] rounded-lg border border-[#dadce0] mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-[#e8f0fe] text-[#1a73e8] mt-0.5">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#202124]">Anyone with the link</p>
              <p className="text-xs text-[#5f6368]">
                Anyone on the internet with this link can edit in real-time
              </p>
            </div>
            <span className="text-xs font-medium text-[#1a73e8] py-1 px-2">Editor</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 border border-[#dadce0] hover:bg-[#f1f3f4] text-[#1a73e8] rounded-full text-sm font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Link copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span>Copy link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-sm font-medium transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
