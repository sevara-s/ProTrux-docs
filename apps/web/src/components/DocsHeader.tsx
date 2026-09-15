import React, { useState, useRef, useEffect } from 'react';
import {
  Star,
  Folder,
  Cloud,
  CloudOff,
  Check,
  Lock,
  MessageSquare,
  History,
  Wifi,
  WifiOff,
  ChevronRight,
  FileText,
  Trash2,
  Download,
  Copy,
  Plus,
  ArrowLeft,
  Printer,
  FileCode,
  Table as TableIcon,
} from 'lucide-react';
import { UserPresence, SyncStatus } from '@protrux/shared';
import { Editor } from '@tiptap/react';

interface DocsHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  syncStatus: SyncStatus;
  collaborators: UserPresence[];
  currentUser: { name: string; color: string };
  onUpdateUser: (name: string, color: string) => void;
  isSimulatedOffline: boolean;
  onToggleSimulateOffline: () => void;
  onOpenWordCount: () => void;
  onOpenShare: () => void;
  onNavigateHome: () => void;
  onDeleteDocument: () => void;
  onNewDocument: () => void;
  editor: Editor | null;
}

export const DocsHeader: React.FC<DocsHeaderProps> = ({
  title,
  onTitleChange,
  syncStatus,
  collaborators,
  currentUser,
  onUpdateUser,
  isSimulatedOffline,
  onToggleSimulateOffline,
  onOpenWordCount,
  onOpenShare,
  onNavigateHome,
  onDeleteDocument,
  onNewDocument,
  editor,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const [isStarred, setIsStarred] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleInput(title);
  }, [title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Close open dropdown menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setTitleInput(title);
    }
  };

  const handleDownload = (format: 'md' | 'html' | 'txt' | 'print') => {
    if (!editor) return;
    setActiveMenu(null);

    if (format === 'print') {
      window.print();
      return;
    }

    let blob: Blob;
    let extension: string;

    if (format === 'md') {
      blob = new Blob([`# ${title}\n\n${editor.getText()}`], { type: 'text/markdown;charset=utf-8' });
      extension = 'md';
    } else if (format === 'html') {
      blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${editor.getHTML()}</body></html>`], { type: 'text/html;charset=utf-8' });
      extension = 'html';
    } else {
      blob = new Blob([editor.getText()], { type: 'text/plain;charset=utf-8' });
      extension = 'txt';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderCloudStatus = () => {
    if (isSimulatedOffline || syncStatus === 'offline') {
      return (
        <div
          className="flex items-center gap-1 text-xs text-[#d93025] cursor-pointer"
          title="Working offline. All changes are securely saved to browser IndexedDB."
        >
          <CloudOff className="w-4 h-4" />
          <span className="hidden md:inline font-medium">Offline (saved locally)</span>
        </div>
      );
    }

    if (syncStatus === 'syncing') {
      return (
        <div className="flex items-center gap-1 text-xs text-[#5f6368]" title="Saving changes to cloud...">
          <Cloud className="w-4 h-4 animate-pulse text-[#1a73e8]" />
          <span className="hidden md:inline">Saving...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-xs text-[#5f6368]" title="Document status: Saved to cloud & SQLite">
        <Cloud className="w-4 h-4 text-[#5f6368]" />
        <span className="hidden md:inline">Saved to Drive</span>
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-[#dadce0] px-4 pt-2 pb-1 select-none sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left: Google Docs Logo + Title + Menus */}
        <div className="flex items-start gap-3 min-w-0">
          {/* Authentic Google Docs Blue Icon */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="mt-0.5 group focus:outline-none"
            title="Docs home"
          >
            <svg className="w-9 h-9" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 4H10C8.89543 4 8 4.89543 8 6V34C8 35.1046 8.89543 36 10 36H30C31.1046 36 32 35.1046 32 34V11L25 4Z" fill="#4285F4"/>
              <path d="M25 4L32 11H25V4Z" fill="#A1C2FA"/>
              <rect x="13" y="16" width="14" height="2" rx="1" fill="white"/>
              <rect x="13" y="21" width="14" height="2" rx="1" fill="white"/>
              <rect x="13" y="26" width="9" height="2" rx="1" fill="white"/>
            </svg>
          </button>

          {/* Title and Menu bar container */}
          <div className="flex flex-col min-w-0">
            {/* Document Title & Meta actions */}
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSubmit();
                    if (e.key === 'Escape') {
                      setTitleInput(title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="text-lg font-medium text-[#202124] px-1 py-0 border border-[#1a73e8] rounded outline-none ring-2 ring-[#e8f0fe] bg-white min-w-[160px]"
                />
              ) : (
                <span
                  onClick={() => setIsEditingTitle(true)}
                  className="text-lg font-medium text-[#202124] hover:border hover:border-[#dadce0] px-1 py-0 rounded cursor-pointer truncate max-w-sm md:max-w-md"
                  title="Rename"
                >
                  {title || 'Untitled document'}
                </span>
              )}

              {/* Star toggle */}
              <button
                type="button"
                onClick={() => setIsStarred(!isStarred)}
                className={`p-1 rounded-full hover:bg-[#f1f3f4] transition-colors ${
                  isStarred ? 'text-[#fbbc04]' : 'text-[#5f6368]'
                }`}
                title={isStarred ? 'Starred' : 'Star document'}
              >
                <Star className="w-4 h-4 fill-current" />
              </button>

              {/* Move to folder */}
              <button
                type="button"
                className="p-1 text-[#5f6368] hover:text-[#202124] rounded-full hover:bg-[#f1f3f4]"
                title="Move to folder"
              >
                <Folder className="w-4 h-4" />
              </button>

              {/* Cloud sync status indicator */}
              <div className="ml-1">{renderCloudStatus()}</div>
            </div>

            {/* Google Docs Classic Menu Bar */}
            <div className="flex items-center gap-0.5 mt-0.5 text-xs text-[#202124]" ref={menuContainerRef}>
              {/* File Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                  className={`px-2 py-0.5 rounded hover:bg-[#f1f3f4] ${activeMenu === 'file' ? 'bg-[#e8f0fe] text-[#1a73e8]' : ''}`}
                >
                  File
                </button>
                {activeMenu === 'file' && (
                  <div className="absolute left-0 mt-1 w-56 bg-white rounded shadow-lg border border-[#dadce0] py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => { onNewDocument(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> New document</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+N</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { onNavigateHome(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Documents home</span>
                    </button>
                    <div className="h-[1px] bg-[#dadce0] my-1" />
                    <button
                      type="button"
                      onClick={() => handleDownload('md')}
                      className="w-full px-4 py-1.5 flex items-center gap-2 hover:bg-[#f1f3f4] text-left"
                    >
                      <Download className="w-3.5 h-3.5 text-[#5f6368]" /> Download as Markdown (.md)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload('html')}
                      className="w-full px-4 py-1.5 flex items-center gap-2 hover:bg-[#f1f3f4] text-left"
                    >
                      <Download className="w-3.5 h-3.5 text-[#5f6368]" /> Download as HTML (.html)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload('txt')}
                      className="w-full px-4 py-1.5 flex items-center gap-2 hover:bg-[#f1f3f4] text-left"
                    >
                      <Download className="w-3.5 h-3.5 text-[#5f6368]" /> Download as Plain text (.txt)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload('print')}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span className="flex items-center gap-2"><Printer className="w-3.5 h-3.5" /> Print</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+P</span>
                    </button>
                    <div className="h-[1px] bg-[#dadce0] my-1" />
                    <button
                      type="button"
                      onClick={() => { onDeleteDocument(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 flex items-center gap-2 hover:bg-[#fce8e6] text-[#d93025] text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Move to trash
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                  className={`px-2 py-0.5 rounded hover:bg-[#f1f3f4] ${activeMenu === 'edit' ? 'bg-[#e8f0fe] text-[#1a73e8]' : ''}`}
                >
                  Edit
                </button>
                {activeMenu === 'edit' && (
                  <div className="absolute left-0 mt-1 w-52 bg-white rounded shadow-lg border border-[#dadce0] py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => { editor?.chain().focus().undo().run(); setActiveMenu(null); }}
                      disabled={!editor?.can().undo()}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left disabled:opacity-40"
                    >
                      <span>Undo</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+Z</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor?.chain().focus().redo().run(); setActiveMenu(null); }}
                      disabled={!editor?.can().redo()}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left disabled:opacity-40"
                    >
                      <span>Redo</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+Y</span>
                    </button>
                    <div className="h-[1px] bg-[#dadce0] my-1" />
                    <button
                      type="button"
                      onClick={() => { editor?.chain().focus().selectAll().run(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span>Select all</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+A</span>
                    </button>
                  </div>
                )}
              </div>

              {/* View Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                  className={`px-2 py-0.5 rounded hover:bg-[#f1f3f4] ${activeMenu === 'view' ? 'bg-[#e8f0fe] text-[#1a73e8]' : ''}`}
                >
                  View
                </button>
                {activeMenu === 'view' && (
                  <div className="absolute left-0 mt-1 w-52 bg-white rounded shadow-lg border border-[#dadce0] py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => { onOpenWordCount(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span>Word count</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+Shift+C</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!document.fullscreenElement) {
                          document.documentElement.requestFullscreen();
                        } else {
                          document.exitFullscreen();
                        }
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span>Full screen</span>
                      <span className="text-[#5f6368] text-[10px]">F11</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Insert Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === 'insert' ? null : 'insert')}
                  className={`px-2 py-0.5 rounded hover:bg-[#f1f3f4] ${activeMenu === 'insert' ? 'bg-[#e8f0fe] text-[#1a73e8]' : ''}`}
                >
                  Insert
                </button>
                {activeMenu === 'insert' && (
                  <div className="absolute left-0 mt-1 w-52 bg-white rounded shadow-lg border border-[#dadce0] py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        editor?.chain().focus().setHorizontalRule().run();
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-1.5 hover:bg-[#f1f3f4] text-left"
                    >
                      Horizontal line
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        editor?.chain().focus().insertContent('<hr style="page-break-after: always; border: 1px dashed #dadce0; margin: 30px 0;" /><p></p>').run();
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-1.5 hover:bg-[#f1f3f4] text-left font-medium text-[#1a73e8]"
                    >
                      Page break (New page)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                        editor?.chain().focus().insertContent(`<strong>${dateStr}</strong> `).run();
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-1.5 hover:bg-[#f1f3f4] text-left"
                    >
                      Date
                    </button>
                  </div>
                )}
              </div>

              {/* Format Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === 'format' ? null : 'format')}
                  className={`px-2 py-0.5 rounded hover:bg-[#f1f3f4] ${activeMenu === 'format' ? 'bg-[#e8f0fe] text-[#1a73e8]' : ''}`}
                >
                  Format
                </button>
                {activeMenu === 'format' && (
                  <div className="absolute left-0 mt-1 w-52 bg-white rounded shadow-lg border border-[#dadce0] py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => { editor?.chain().focus().toggleBold().run(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span className="font-bold">Bold</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+B</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor?.chain().focus().toggleItalic().run(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span className="italic">Italic</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+I</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor?.chain().focus().toggleUnderline().run(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span className="underline">Underline</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+U</span>
                    </button>
                    <div className="h-[1px] bg-[#dadce0] my-1" />
                    <button
                      type="button"
                      onClick={() => { editor?.chain().focus().unsetAllMarks().clearNodes().run(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 hover:bg-[#f1f3f4] text-left"
                    >
                      Clear formatting
                    </button>
                  </div>
                )}
              </div>

              {/* Tools Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
                  className={`px-2 py-0.5 rounded hover:bg-[#f1f3f4] ${activeMenu === 'tools' ? 'bg-[#e8f0fe] text-[#1a73e8]' : ''}`}
                >
                  Tools
                </button>
                {activeMenu === 'tools' && (
                  <div className="absolute left-0 mt-1 w-56 bg-white rounded shadow-lg border border-[#dadce0] py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => { onOpenWordCount(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span>Word count</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+Shift+C</span>
                    </button>
                    <div className="h-[1px] bg-[#dadce0] my-1" />
                    <button
                      type="button"
                      onClick={() => { onToggleSimulateOffline(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span>{isSimulatedOffline ? 'Restore Network Connection' : 'Simulate Offline Mode'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Presence, Offline Simulator, Share Button, Profile */}
        <div className="flex items-center gap-3">
          {/* Offline Simulator Button (Highlighted for video demo!) */}
          <button
            type="button"
            onClick={onToggleSimulateOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isSimulatedOffline
                ? 'bg-[#ea4335] text-white border-[#d93025] shadow-sm font-semibold'
                : 'bg-[#f1f3f4] text-[#3c4043] border-transparent hover:bg-[#e8eaed]'
            }`}
            title="Simulate network disconnect for offline evaluation"
          >
            {isSimulatedOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Restore Network</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Simulate Offline</span>
              </>
            )}
          </button>

          {/* Collaborator Avatars */}
          <div className="flex items-center -space-x-1.5">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white shadow-xs"
                style={{ backgroundColor: c.color }}
                title={`Active collaborator: ${c.name}`}
              >
                {c.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>

          {/* Activity / Comments icon */}
          <button
            type="button"
            className="p-2 text-[#5f6368] hover:text-[#202124] rounded-full hover:bg-[#f1f3f4]"
            title="Open comment history"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Google Docs Blue Share Button */}
          <button
            type="button"
            onClick={onOpenShare}
            className="flex items-center gap-2 px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-sm font-medium transition-colors shadow-xs"
            title="Share with people"
          >
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Share</span>
          </button>

          {/* Current User Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
            style={{ backgroundColor: currentUser.color }}
            title={`Signed in as: ${currentUser.name}`}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
