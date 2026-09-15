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

  return (
    <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-stone-200/90 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
          <h3 className="text-base font-semibold text-stone-900">Word Count</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-stone-800">
          <div className="flex justify-between items-center py-1 border-b border-stone-100">
            <span className="text-stone-500 text-xs font-medium">Pages</span>
            <span className="font-semibold text-stone-900">{pages}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-stone-100">
            <span className="text-stone-500 text-xs font-medium">Words</span>
            <span className="font-semibold text-stone-900">{words.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-stone-100">
            <span className="text-stone-500 text-xs font-medium">Characters</span>
            <span className="font-semibold text-stone-900">{chars.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-stone-500 text-xs font-medium">Characters (no spaces)</span>
            <span className="font-semibold text-stone-900">{charsNoSpaces.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={displayLive}
              onChange={(e) => onToggleDisplayLive(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-stone-300 accent-indigo-600"
            />
            <span>Show live count bar</span>
          </label>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
