import React, { useState, useRef, useEffect } from 'react';
import {
  Star,
  Folder,
  Cloud,
  CloudOff,
  Lock,
  MessageSquare,
  Wifi,
  WifiOff,
  FileText,
  Trash2,
  Download,
  Plus,
  Printer,
  Sparkles,
  ChevronDown,
  Check,
  Users,
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { useModal, useModalStore } from '@/store/modal-store';
import { useUserStore } from '@/store/user-store';
import { useDocumentStore } from '@/store/document-store';

export const DEMO_PERSONAS = [
  { name: 'Elena Rostova', color: '#8b5cf6', role: 'Lead Author' },
  { name: 'Marcus Vance', color: '#10b981', role: 'Backend Architect' },
  { name: 'Liam Chen', color: '#0ea5e9', role: 'Staff Engineer' },
  { name: 'Sophia Lin', color: '#f59e0b', role: 'Product Designer' },
];

interface DocsHeaderProps {
  editor: Editor | null;
  onNavigateHome: () => void;
  onDeleteDocument: () => void;
  onNewDocument: () => void;
}

export const DocsHeader: React.FC<DocsHeaderProps> = ({
  editor,
  onNavigateHome,
  onDeleteDocument,
  onNewDocument,
}) => {
  const title = useDocumentStore((state) => state.currentDocTitle);
  const currentDocId = useDocumentStore((state) => state.currentDocId);
  const updateDocTitle = useDocumentStore((state) => state.updateDocTitle);

  const currentUser = useUserStore((state) => state.currentUser);
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const collaborators = useUserStore((state) => state.collaborators);
  const syncStatus = useUserStore((state) => state.syncStatus);
  const isSimulatedOffline = useUserStore((state) => state.isSimulatedOffline);
  const toggleSimulatedOffline = useUserStore((state) => state.toggleSimulatedOffline);

  const shareModal = useModal('share');
  const wordCountModal = useModal('word-count');

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
      updateDocTitle(currentDocId, trimmed);
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
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-800 border border-amber-200/80 font-medium"
          title="Offline mode active. All keystrokes saved to browser IndexedDB."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Offline (IndexedDB active)</span>
        </div>
      );
    }

    if (syncStatus === 'syncing') {
      return (
        <div
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium"
          title="Syncing CRDT state vectors over WebSocket..."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
          <span>Syncing...</span>
        </div>
      );
    }

    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
        title="Document is synchronized with SQLite & WebSocket hub"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Saved to Cloud</span>
      </div>
    );
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-2 select-none sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center justify-between">
        {/* Left: ProTrux Brand Logo + Title + Menus */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2 group focus:outline-none shrink-0"
            title="ProTrux Canvas Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-indigo-100" />
            </div>
            <span className="font-bold text-sm tracking-tight text-stone-900 hidden sm:inline">
              ProTrux<span className="text-indigo-600 font-semibold ml-0.5">Canvas</span>
            </span>
          </button>

          <div className="w-[1px] h-6 bg-stone-200 mx-1 hidden sm:block" />

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
                  className="text-base font-semibold text-stone-900 px-2 py-0.5 border border-indigo-500 rounded-md outline-none ring-2 ring-indigo-100 bg-white min-w-[160px]"
                />
              ) : (
                <span
                  onClick={() => setIsEditingTitle(true)}
                  className="text-base font-semibold text-stone-900 hover:bg-stone-100 px-2 py-0.5 rounded-md cursor-pointer truncate max-w-sm md:max-w-md tracking-tight transition-colors"
                  title="Click to rename"
                >
                  {title || 'Untitled document'}
                </span>
              )}

              {/* Star toggle */}
              <button
                type="button"
                onClick={() => setIsStarred(!isStarred)}
                className={`p-1 rounded-md hover:bg-stone-100 transition-colors ${
                  isStarred ? 'text-amber-500' : 'text-stone-400 hover:text-stone-600'
                }`}
                title={isStarred ? 'Starred' : 'Star document'}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
              </button>

              {/* Move to folder */}
              <button
                type="button"
                className="p-1 text-stone-400 hover:text-stone-600 rounded-md hover:bg-stone-100"
                title="Organize in workspace"
              >
                <Folder className="w-3.5 h-3.5" />
              </button>

              {/* Cloud sync status indicator */}
              <div className="ml-1">{renderCloudStatus()}</div>
            </div>

            {/* ProTrux Editorial Menu Bar */}
            <div className="flex items-center gap-0.5 mt-0.5 text-xs text-stone-600" ref={menuContainerRef}>
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
                    <button
                      type="button"
                      onClick={() => {
                        useModalStore.getState().openModal('open-file');
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span className="flex items-center gap-2"><Folder className="w-3.5 h-3.5 text-[#5f6368]" /> Open / Upload file</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+O</span>
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
                      onClick={() => { wordCountModal.openModal(); setActiveMenu(null); }}
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
                      onClick={() => { wordCountModal.openModal(); setActiveMenu(null); }}
                      className="w-full px-4 py-1.5 flex items-center justify-between hover:bg-[#f1f3f4] text-left"
                    >
                      <span>Word count</span>
                      <span className="text-[#5f6368] text-[10px]">Ctrl+Shift+C</span>
                    </button>
                    <div className="h-[1px] bg-[#dadce0] my-1" />
                    <button
                      type="button"
                      onClick={() => { toggleSimulatedOffline(); setActiveMenu(null); }}
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

        {/* Right: Persona Switcher, Offline Simulator, Collaborators, Share Button */}
        <div className="flex items-center gap-2.5">
          {/* 1-Click Persona Switcher for Multi-User Evaluator Testing */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'persona' ? null : 'persona')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium transition-colors"
              title="Switch collaborator persona to test multi-user editing"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: currentUser.color }} />
              <span className="truncate max-w-[110px] font-semibold text-stone-800">{currentUser.name}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>
            {activeMenu === 'persona' && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 mb-1">
                  Switch Test Persona (Multi-User)
                </div>
                {DEMO_PERSONAS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setCurrentUser({ name: p.name, color: p.color });
                      setActiveMenu(null);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between hover:bg-indigo-50/60 text-left transition-colors ${
                      currentUser.name === p.name ? 'bg-indigo-50 font-semibold text-indigo-950' : 'text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: p.color }} />
                      <div>
                        <p className="font-medium text-xs">{p.name}</p>
                        <p className="text-[10px] text-stone-400">{p.role}</p>
                      </div>
                    </div>
                    {currentUser.name === p.name && (
                      <span className="text-indigo-600 text-xs font-bold">Active</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Network Simulator Button */}
          <button
            type="button"
            onClick={toggleSimulatedOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSimulatedOffline
                ? 'bg-amber-600 text-white border-amber-700 shadow-sm font-semibold'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
            }`}
            title="Simulate network disconnect for offline evaluation"
          >
            {isSimulatedOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Reconnect Network</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Simulate Offline</span>
              </>
            )}
          </button>

          {/* Collaborator Presence Avatars */}
          {collaborators.length > 0 && (
            <div className="flex items-center -space-x-1.5">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white shadow-xs hover:scale-110 transition-transform cursor-default"
                  style={{ backgroundColor: c.color }}
                  title={`Active peer: ${c.name}`}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}

          {/* Share Button */}
          <button
            type="button"
            onClick={shareModal.openModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            title="Share document link"
          >
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </header>
  );
};
