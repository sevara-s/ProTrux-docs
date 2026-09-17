import React, { useState, useRef, useEffect } from 'react';
import { Wifi, WifiOff, ChevronDown, Hexagon, Share2 } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { useModal, useModalStore } from '@/store/modal-store';
import { useUserStore } from '@/store/user-store';
import { useDocumentStore } from '@/store/document-store';
import { ThemeToggle } from '@/components/ThemeToggle';

export const DEMO_PERSONAS = [
  { name: 'Elena Rostova', color: '#164f42', role: 'Lead Author' },
  { name: 'Marcus Vance', color: '#1f6f5c', role: 'Systems' },
  { name: 'Liam Chen', color: '#3d8f7a', role: 'Staff Eng' },
  { name: 'Sophia Lin', color: '#5aab94', role: 'Design' },
];

interface DocsHeaderProps {
  editor: Editor | null;
  onNavigateHome: () => void;
  onDeleteDocument: () => void;
  onNewDocument: () => void;
  onRenameDocument?: (id: string, title: string) => void | Promise<void>;
}

const menuBtn = (active: boolean) =>
  `px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase transition-colors ${
    active ? 'bg-accent/20 text-accent' : 'text-chrome-muted hover:text-chrome-fg hover:bg-white/5'
  }`;

export const DocsHeader: React.FC<DocsHeaderProps> = ({
  editor,
  onNavigateHome,
  onDeleteDocument,
  onNewDocument,
  onRenameDocument,
}) => {
  const title = useDocumentStore((s) => s.currentDocTitle);
  const currentDocId = useDocumentStore((s) => s.currentDocId);
  const updateDocTitle = useDocumentStore((s) => s.updateDocTitle);
  const canEdit = useDocumentStore((s) => s.canEdit);
  const accessMode = useDocumentStore((s) => s.accessMode);

  const currentUser = useUserStore((s) => s.currentUser);
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);
  const collaborators = useUserStore((s) => s.collaborators);
  const syncStatus = useUserStore((s) => s.syncStatus);
  const isSimulatedOffline = useUserStore((s) => s.isSimulatedOffline);
  const toggleSimulatedOffline = useUserStore((s) => s.toggleSimulatedOffline);

  const shareModal = useModal('share');
  const wordCountModal = useModal('word-count');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setTitleInput(title), [title]);
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    const onOut = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = titleInput.trim().slice(0, 200);
    if (trimmed && trimmed !== title) {
      if (onRenameDocument) void onRenameDocument(currentDocId, trimmed);
      else updateDocTitle(currentDocId, trimmed);
    } else setTitleInput(title);
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
      blob = new Blob(
        [`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${editor.getHTML()}</body></html>`],
        { type: 'text/html;charset=utf-8' }
      );
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

  const syncChip = () => {
    if (isSimulatedOffline || syncStatus === 'offline') {
      return (
        <span className="ptx-chip bg-accent-soft text-accent border-accent/30">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
          Offline
        </span>
      );
    }
    if (syncStatus === 'connecting') {
      return (
        <span className="ptx-chip text-chrome-muted border-white/10 bg-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-chrome-muted animate-pulse" />
          Connecting
        </span>
      );
    }
    if (syncStatus === 'syncing' || syncStatus === 'error') {
      return (
        <span className="ptx-chip bg-accent/15 text-accent border-accent/25">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          {syncStatus === 'error' ? 'Retry' : 'Merge'}
        </span>
      );
    }
    return (
      <span className="ptx-chip bg-accent/20 text-accent border-accent/30">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        Synced
      </span>
    );
  };

  const Menu: React.FC<{ id: string; label: string; children: React.ReactNode; wide?: string }> = ({
    id,
    label,
    children,
    wide = 'w-56',
  }) => (
    <div className="relative">
      <button type="button" onClick={() => setActiveMenu(activeMenu === id ? null : id)} className={menuBtn(activeMenu === id)}>
        {label}
      </button>
      {activeMenu === id && <div className={`absolute left-0 mt-2 ${wide} ptx-menu`}>{children}</div>}
    </div>
  );

  const item = (label: string, onClick: () => void, hint?: string, danger?: boolean) => (
    <button
      type="button"
      onClick={() => {
        onClick();
        setActiveMenu(null);
      }}
      className={`ptx-menu-item ${danger ? '!text-accent hover:!bg-accent-soft' : ''}`}
    >
      <span>{label}</span>
      {hint && <span className="text-[10px] font-mono text-fg-muted">{hint}</span>}
    </button>
  );

  return (
    <header className="ptx-chrome px-4 py-2.5 select-none sticky top-0 z-30">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button type="button" onClick={onNavigateHome} className="flex items-center gap-2 shrink-0 group" title="Home">
            <div className="w-8 h-8 rounded-lg bg-accent text-accent-fg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Hexagon className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="ptx-mark text-lg text-chrome-fg hidden md:inline leading-none">ProTrux</span>
          </button>

          <div className="w-px h-8 bg-white/10 hidden sm:block" />

          <div className="min-w-0 flex-1" ref={menuContainerRef}>
            <div className="flex items-center gap-2 flex-wrap">
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
                  className="ptx-mark text-base bg-white/10 border border-accent/40 rounded-md px-2 py-0.5 text-chrome-fg outline-none min-w-[160px] max-w-md"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (canEdit) setIsEditingTitle(true);
                  }}
                  className={`ptx-mark text-base text-chrome-fg truncate max-w-[220px] md:max-w-md text-left ${
                    canEdit ? 'hover:text-accent' : 'cursor-default'
                  }`}
                >
                  {title || 'Untitled document'}
                </button>
              )}
              {syncChip()}
              {!canEdit && (
                <span className="text-[10px] font-mono uppercase tracking-wide text-accent/90 px-2 py-0.5 rounded-md bg-accent/15 border border-accent/25">
                  View only
                </span>
              )}
              {canEdit && accessMode === 'private' && (
                <span className="text-[10px] font-mono uppercase tracking-wide text-chrome-muted px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                  Private
                </span>
              )}
            </div>

            <div className="flex items-center gap-0.5 mt-1.5">
              <Menu id="file" label="File" wide="w-60">
                {item('New document', onNewDocument, '⌘N')}
                {item('Home', onNavigateHome)}
                {item('Open / Import', () => useModalStore.getState().openModal('open-file'), '⌘O')}
                <div className="h-px bg-line my-1" />
                {item('Export Markdown', () => handleDownload('md'))}
                {item('Export HTML', () => handleDownload('html'))}
                {item('Export plain text', () => handleDownload('txt'))}
                {item('Print', () => handleDownload('print'), '⌘P')}
                <div className="h-px bg-line my-1" />
                {item('Move to trash', onDeleteDocument, undefined, true)}
              </Menu>
              <Menu id="edit" label="Edit">
                {item('Undo', () => editor?.commands.undo(), '⌘Z')}
                {item('Redo', () => editor?.commands.redo(), '⌘Y')}
                <div className="h-px bg-line my-1" />
                {item('Select all', () => editor?.chain().focus().selectAll().run(), '⌘A')}
              </Menu>
              <Menu id="insert" label="Insert">
                {item('Horizontal rule', () => editor?.chain().focus().setHorizontalRule().run())}
                {item('Section break', () => editor?.chain().focus().insertContent('<hr /><p></p>').run())}
                {item("Today's date", () => {
                  const d = new Date().toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  editor?.chain().focus().insertContent(`<strong>${d}</strong> `).run();
                })}
              </Menu>
              <Menu id="format" label="Format">
                {item('Bold', () => editor?.chain().focus().toggleBold().run(), '⌘B')}
                {item('Italic', () => editor?.chain().focus().toggleItalic().run(), '⌘I')}
                {item('Underline', () => editor?.chain().focus().toggleUnderline().run(), '⌘U')}
                <div className="h-px bg-line my-1" />
                {item('Clear marks', () => editor?.chain().focus().unsetAllMarks().clearNodes().run())}
              </Menu>
              <Menu id="tools" label="Tools" wide="w-64">
                {item('Word count', () => wordCountModal.openModal())}
                {item('Fullscreen', () => {
                  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                  else document.exitFullscreen();
                })}
                {item(isSimulatedOffline ? 'Restore network' : 'Simulate offline', toggleSimulatedOffline)}
              </Menu>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle compact className="hidden sm:inline-flex" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'persona' ? null : 'persona')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-chrome-fg hover:bg-white/10 transition-colors"
              title="Change who you appear as to other users"
            >
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: currentUser.color }} />
              <span className="font-semibold truncate max-w-[110px]">
                <span className="text-chrome-muted font-medium hidden xl:inline">You · </span>
                {currentUser.name}
              </span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            {activeMenu === 'persona' && (
              <div className="absolute right-0 mt-2 w-64 ptx-menu">
                <p className="px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-fg-muted">
                  Editing as
                </p>
                <p className="px-3.5 pb-2 text-[10px] text-fg-muted leading-snug">
                  Choose a display name so others can see who is typing.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    useUserStore.getState().requestIdentityEdit();
                    setActiveMenu(null);
                  }}
                  className="ptx-menu-item !text-accent font-semibold"
                >
                  Enter my name…
                </button>
                <div className="h-px bg-line my-1" />
                {DEMO_PERSONAS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setCurrentUser({ name: p.name, color: p.color });
                      useUserStore.getState().markIdentityChosen();
                      editor?.commands.updateUser?.({ name: p.name, color: p.color });
                      setActiveMenu(null);
                    }}
                    className={`ptx-menu-item ${currentUser.name === p.name ? '!bg-accent-soft !text-accent font-bold' : ''}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.color }} />
                      <span>
                        <span className="block text-xs">{p.name}</span>
                        <span className="block text-[10px] text-fg-muted font-normal">{p.role}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSimulatedOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isSimulatedOffline
                ? 'bg-accent text-accent-fg border-accent'
                : 'bg-white/5 text-chrome-fg border-white/10 hover:bg-white/10'
            }`}
          >
            {isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">{isSimulatedOffline ? 'Reconnect' : 'Offline'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            {collaborators.length > 0 ? (
              <>
                <div className="flex -space-x-1.5">
                  {collaborators.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-accent-fg ring-2 ring-chrome"
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    >
                      {c.name.charAt(0)}
                    </div>
                  ))}
                </div>
                <span className="hidden md:inline text-[10px] font-mono text-chrome-muted max-w-[140px] truncate">
                  {collaborators.map((c) => c.name.split(' ')[0]).join(', ')}
                </span>
              </>
            ) : (
              <span className="hidden lg:inline text-[10px] font-mono text-chrome-muted">
                Only you
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={shareModal.openModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:brightness-110 text-accent-fg rounded-lg text-xs font-bold transition-all shadow-glow"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>
    </header>
  );
};
