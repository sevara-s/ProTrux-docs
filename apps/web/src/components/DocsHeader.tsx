import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Wifi, WifiOff, ChevronDown, Hexagon, Share2 } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { useModal, useModalStore } from '@/store/modal-store';
import { useUserStore } from '@/store/user-store';
import { useDocumentStore } from '@/store/document-store';
import { usePageStore } from '@/store/page-store';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  exportDocx,
  exportHtml,
  exportMarkdown,
  exportPdf,
  exportPlainText,
} from '@/services/export';

export const DEMO_PERSONAS = [
  { name: 'Elena Rostova', color: '#c8890a', role: 'Lead Author' },
  { name: 'Marcus Vance', color: '#2f5aa8', role: 'Systems' },
  { name: 'Liam Chen', color: '#1a7a6d', role: 'Staff Eng' },
  { name: 'Sophia Lin', color: '#c45c26', role: 'Design' },
];

interface DocsHeaderProps {
  editor: Editor | null;
  onNavigateHome: () => void;
  onDeleteDocument: () => void;
  onNewDocument: () => void;
  onRenameDocument?: (id: string, title: string) => void | Promise<void>;
}

const menuBtn = (active: boolean) =>
  `px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase transition-colors cursor-pointer ${
    active ? 'bg-accent/20 text-accent' : 'text-chrome-fg/80 hover:text-chrome-fg hover:bg-white/10'
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

  const currentUser = useUserStore((s) => s.currentUser);
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);
  const collaborators = useUserStore((s) => s.collaborators);
  const syncStatus = useUserStore((s) => s.syncStatus);
  const isSimulatedOffline = useUserStore((s) => s.isSimulatedOffline);
  const toggleSimulatedOffline = useUserStore((s) => s.toggleSimulatedOffline);

  const shareModal = useModal('share');
  const wordCountModal = useModal('word-count');
  const pageSetupModal = useModal('page-setup');

  const pageSetup = usePageStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const personaBtnRef = useRef<HTMLButtonElement>(null);
  const [personaPos, setPersonaPos] = useState({ top: 0, left: 0 });

  useEffect(() => setTitleInput(title), [title]);
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (!activeMenu) return;
    const onOut = (e: MouseEvent) => {
      const target = e.target as Node;
      if (headerRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.('[data-header-menu]')) return;
      setActiveMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenu(null);
    };
    document.addEventListener('mousedown', onOut);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOut);
      document.removeEventListener('keydown', onKey);
    };
  }, [activeMenu]);

  useLayoutEffect(() => {
    if (activeMenu !== 'persona' || !personaBtnRef.current) return;
    const place = () => {
      const rect = personaBtnRef.current!.getBoundingClientRect();
      const width = 256;
      const left = Math.min(rect.right - width, window.innerWidth - width - 8);
      setPersonaPos({ top: rect.bottom + 4, left: Math.max(8, left) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [activeMenu]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = titleInput.trim().slice(0, 200);
    if (trimmed && trimmed !== title) {
      if (onRenameDocument) void onRenameDocument(currentDocId, trimmed);
      else updateDocTitle(currentDocId, trimmed);
    } else setTitleInput(title);
  };

  const handleDownload = async (
    format: 'md' | 'html' | 'txt' | 'print' | 'pdf' | 'docx'
  ) => {
    if (!editor) return;
    // Tear down portaled menus before print so they never appear in the sheet
    flushSync(() => setActiveMenu(null));
    document.querySelectorAll('[data-header-menu]').forEach((el) => el.remove());

    if (format === 'print') {
      requestAnimationFrame(() => window.print());
      return;
    }
    if (format === 'pdf') {
      exportPdf(editor, title, {
        widthIn: pageSetup.widthIn,
        heightIn: pageSetup.heightIn,
        marginLeftIn: pageSetup.marginLeftIn,
        marginRightIn: pageSetup.marginRightIn,
        marginTopIn: pageSetup.marginTopIn,
        marginBottomIn: pageSetup.marginBottomIn,
        orientation: pageSetup.orientation,
      });
      return;
    }
    if (format === 'docx') {
      await exportDocx(editor, title, {
        widthIn: pageSetup.widthIn,
        heightIn: pageSetup.heightIn,
        marginLeftIn: pageSetup.marginLeftIn,
        marginRightIn: pageSetup.marginRightIn,
        marginTopIn: pageSetup.marginTopIn,
        marginBottomIn: pageSetup.marginBottomIn,
        orientation: pageSetup.orientation,
      });
      return;
    }
    if (format === 'md') exportMarkdown(editor, title);
    else if (format === 'html') {
      exportHtml(editor, title, {
        widthIn: pageSetup.widthIn,
        heightIn: pageSetup.heightIn,
        marginLeftIn: pageSetup.marginLeftIn,
        marginRightIn: pageSetup.marginRightIn,
        marginTopIn: pageSetup.marginTopIn,
        marginBottomIn: pageSetup.marginBottomIn,
      });
    } else exportPlainText(editor, title);
  };

  const syncLabel = () => {
    if (isSimulatedOffline || syncStatus === 'offline') return 'LOCAL FORK';
    if (syncStatus === 'connecting') return 'TUNING';
    if (syncStatus === 'syncing') return 'MERGING';
    if (syncStatus === 'error') return 'RETRY';
    return 'MERGED';
  };

  const peerCount = 1 + collaborators.length;

  const Menu: React.FC<{ id: string; label: string; children: React.ReactNode; wide?: number }> = ({
    id,
    label,
    children,
    wide = 224,
  }) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const open = activeMenu === id;
    const [pos, setPos] = useState({ top: 0, left: 0 });

    useLayoutEffect(() => {
      if (!open || !btnRef.current) return;
      const place = () => {
        const rect = btnRef.current!.getBoundingClientRect();
        const left = Math.min(rect.left, window.innerWidth - wide - 8);
        setPos({ top: rect.bottom + 4, left: Math.max(8, left) });
      };
      place();
      window.addEventListener('resize', place);
      window.addEventListener('scroll', place, true);
      return () => {
        window.removeEventListener('resize', place);
        window.removeEventListener('scroll', place, true);
      };
    }, [open, wide]);

    return (
      <div className="relative shrink-0">
        <button
          ref={btnRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenu(open ? null : id);
          }}
          className={menuBtn(open)}
        >
          {label}
        </button>
        {open &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              data-header-menu
              className="ptx-menu"
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: wide,
                zIndex: 9999,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {children}
            </div>,
            document.body
          )}
      </div>
    );
  };

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
    <header ref={headerRef} className="ptx-chrome px-3 sm:px-4 py-1.5 select-none sticky top-0 z-40">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button type="button" onClick={onNavigateHome} className="flex items-center gap-2 shrink-0 group" title="Home">
            <div className="w-7 h-7 rounded-md bg-accent text-accent-fg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Hexagon className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <span className="ptx-mark text-base text-chrome-fg hidden lg:inline leading-none tracking-tight">ProTrux</span>
          </button>

          <div className="w-px h-6 bg-white/10 hidden sm:block shrink-0" />

          <div className="min-w-0 flex-1 overflow-visible">
            <div className="flex items-center gap-2 min-w-0">
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
                  className="ptx-mark text-sm bg-white/10 border border-accent/40 rounded-md px-2 py-0.5 text-chrome-fg outline-none min-w-[120px] max-w-[240px]"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (canEdit) setIsEditingTitle(true);
                  }}
                  className={`ptx-mark text-sm text-chrome-fg truncate max-w-[140px] sm:max-w-[220px] text-left ${
                    canEdit ? 'hover:text-accent' : 'cursor-default'
                  }`}
                >
                  {title || 'Untitled document'}
                </button>
              )}
              <span className="ptx-signal tabular-nums shrink-0 hidden sm:inline">
                {syncLabel()}
                <span className="text-chrome-muted"> · </span>
                {peerCount}
              </span>
              <div className="flex items-center gap-0.5 ml-0.5 shrink-0">
                <Menu id="file" label="File" wide={256}>
                  {item('New document', onNewDocument, '⌘N')}
                  {item('Home', onNavigateHome)}
                  {item('Open / Import', () => useModalStore.getState().openModal('open-file'), '⌘O')}
                  <div className="h-px bg-line my-1" />
                  {item('Page setup…', () => pageSetupModal.openModal())}
                  <div className="h-px bg-line my-1" />
                  <p className="px-3.5 py-1 text-[10px] font-mono uppercase tracking-widest text-fg-muted">
                    Download
                  </p>
                  {item('PDF document', () => void handleDownload('pdf'), '.pdf')}
                  {item('Microsoft Word', () => void handleDownload('docx'), '.docx')}
                  {item('Markdown', () => void handleDownload('md'), '.md')}
                  {item('Web page', () => void handleDownload('html'), '.html')}
                  {item('Plain text', () => void handleDownload('txt'), '.txt')}
                  {item('Print', () => void handleDownload('print'), '⌘P')}
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
                <Menu id="tools" label="Tools" wide={256}>
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
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle compact className="hidden sm:inline-flex" />

          <div className="relative">
            <button
              ref={personaBtnRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === 'persona' ? null : 'persona');
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-chrome-fg hover:bg-white/10 transition-colors"
              title="Change who you appear as to other users"
            >
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: currentUser.color }} />
              <span className="font-semibold truncate max-w-[90px] hidden sm:inline">{currentUser.name}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            {activeMenu === 'persona' &&
              typeof document !== 'undefined' &&
              createPortal(
                <div
                  data-header-menu
                  className="ptx-menu"
                  style={{
                    position: 'fixed',
                    top: personaPos.top,
                    left: personaPos.left,
                    width: 256,
                    zIndex: 9999,
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <p className="px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-fg-muted">
                    Signal as
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
                </div>,
                document.body
              )}
          </div>

          <button
            type="button"
            onClick={toggleSimulatedOffline}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border transition-all ${
              isSimulatedOffline
                ? 'bg-accent text-accent-fg border-accent'
                : 'bg-white/5 text-chrome-fg border-white/10 hover:bg-white/10'
            }`}
            title={isSimulatedOffline ? 'Rejoin' : 'Fork offline'}
          >
            {isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline font-mono tracking-wide uppercase text-[10px]">
              {isSimulatedOffline ? 'Rejoin' : 'Fork'}
            </span>
          </button>

          <button
            type="button"
            onClick={shareModal.openModal}
            className="flex items-center gap-1 px-2.5 py-1 bg-accent hover:brightness-110 text-accent-fg rounded-md text-xs font-bold transition-all shadow-glow"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>
    </header>
  );
};
