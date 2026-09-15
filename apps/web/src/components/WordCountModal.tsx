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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 border border-[#dadce0] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#dadce0]">
          <h3 className="text-lg font-medium text-[#202124]">Word count</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#5f6368] hover:text-[#202124] rounded-full hover:bg-[#f1f3f4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-[#202124]">
          <div className="flex justify-between">
            <span className="text-[#5f6368]">Pages</span>
            <span className="font-medium">{pages}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5f6368]">Words</span>
            <span className="font-medium">{words.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5f6368]">Characters</span>
            <span className="font-medium">{chars.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#5f6368]">Characters excluding spaces</span>
            <span className="font-medium">{charsNoSpaces.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#dadce0] flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-[#5f6368] cursor-pointer">
            <input
              type="checkbox"
              checked={displayLive}
              onChange={(e) => onToggleDisplayLive(e.target.checked)}
              className="w-4 h-4 rounded text-[#1a73e8] focus:ring-[#1a73e8] border-[#dadce0]"
            />
            <span>Display word count while typing</span>
          </label>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded text-sm font-medium transition-colors shadow-xs"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
