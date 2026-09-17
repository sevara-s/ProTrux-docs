import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import { ResizableImage } from '@/extensions/ResizableImage';
import { FontSize } from '@/extensions/FontSize';
import { CRDTManager } from '../services/crdt';
import { DocsToolbar } from './DocsToolbar';
import { DocsRuler } from './DocsRuler';
import { ModalProvider } from '@/providers/modal-provider';
import { useDocumentStore } from '@/store/document-store';
import { inchesToPx, usePageStore } from '@/store/page-store';
import { useUserStore } from '@/store/user-store';

interface EditorProps {
  crdt: CRDTManager;
  onEditorReady?: (editor: any) => void;
}

export const Editor: React.FC<EditorProps> = ({ crdt, onEditorReady }) => {
  const [zoom, setZoom] = useState(100);
  const [displayLiveWordCount, setDisplayLiveWordCount] = useState(false);
  const [stats, setStats] = useState({
    words: 0,
    chars: 0,
    charsNoSpaces: 0,
    pages: 1,
  });
  const [settling, setSettling] = useState(false);
  const [mergeFlash, setMergeFlash] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);
  const prevSyncRef = useRef<string | null>(null);
  const pendingContent = useDocumentStore((state) => state.pendingContent);
  const setPendingContent = useDocumentStore((state) => state.setPendingContent);
  const canEdit = useDocumentStore((state) => state.canEdit);
  const syncStatus = useUserStore((s) => s.syncStatus);
  const isSimulatedOffline = useUserStore((s) => s.isSimulatedOffline);
  const isForked = isSimulatedOffline || syncStatus === 'offline';

  const widthIn = usePageStore((s) => s.widthIn);
  const heightIn = usePageStore((s) => s.heightIn);
  const marginLeftIn = usePageStore((s) => s.marginLeftIn);
  const marginRightIn = usePageStore((s) => s.marginRightIn);
  const marginTopIn = usePageStore((s) => s.marginTopIn);
  const marginBottomIn = usePageStore((s) => s.marginBottomIn);

  const pageWidthPx = inchesToPx(widthIn);
  const pageHeightPx = inchesToPx(heightIn);
  const padLeft = inchesToPx(marginLeftIn);
  const padRight = inchesToPx(marginRightIn);
  const padTop = inchesToPx(marginTopIn);
  const padBottom = inchesToPx(marginBottomIn);

  const editor = useEditor(
    {
      editable: canEdit,
      extensions: [
        StarterKit.configure({
          history: false,
          heading: {
            levels: [1, 2, 3, 4],
          },
        }),
        Collaboration.configure({
          document: crdt.ydoc,
        }),
        ...(crdt.provider
          ? [
              CollaborationCursor.configure({
                provider: crdt.provider,
                user: {
                  name: crdt.user.name,
                  color: crdt.user.color,
                },
              }),
            ]
          : []),
        Placeholder.configure({
          placeholder: 'Start writing — or invite someone to collaborate…',
        }),
        Underline,
        Highlight.configure({
          multicolor: true,
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        TextStyle,
        Color,
        FontSize,
        FontFamily,
        Link.configure({
          openOnClick: false,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        ResizableImage.configure({
          inline: true,
          allowBase64: true,
        }),
      ],
      editorProps: {
        attributes: {
          class: 'editorial-content focus:outline-none text-paper-ink',
          spellcheck: 'true',
        },
        handleDrop: (view, event, slice, moved) => {
          if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
            const file = event.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                if (src) {
                  const { schema } = view.state;
                  const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  const node = schema.nodes.image.create({ src, alt: file.name });
                  const tr = view.state.tr.insert(coords ? coords.pos : view.state.selection.from, node);
                  view.dispatch(tr);
                }
              };
              reader.readAsDataURL(file);
              return true;
            }
          }
          return false;
        },
        handlePaste: (view, event) => {
          const items = event.clipboardData?.items;
          if (items) {
            for (const item of items) {
              if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const src = e.target?.result as string;
                    if (src) {
                      const { schema } = view.state;
                      const node = schema.nodes.image.create({ src, alt: 'Pasted image' });
                      const tr = view.state.tr.replaceSelectionWith(node);
                      view.dispatch(tr);
                    }
                  };
                  reader.readAsDataURL(file);
                  return true;
                }
              }
            }
          }
          return false;
        },
      },
      onUpdate({ editor }) {
        updateStatistics(editor);
      },
    },
    [crdt.docId, crdt.ydoc.clientID]
  );

  const updateStatistics = (currentEditor: any) => {
    const text = currentEditor.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const pages = Math.max(1, Math.ceil(words / 450));
    setStats({ words, chars, charsNoSpaces, pages });
  };

  useEffect(() => {
    if (!editor) return;
    // Keep TipTap caret labels in sync when "Editing as" changes
    editor.commands.updateUser?.({
      name: crdt.user.name,
      color: crdt.user.color,
    });
  }, [editor, crdt.user.name, crdt.user.color]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(canEdit);
  }, [editor, canEdit]);

  useEffect(() => {
    if (editor && onEditorReady) {
      queueMicrotask(() => {
        onEditorReady(editor);
        updateStatistics(editor);
      });
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    seededRef.current = false;
  }, [crdt.docId]);

  useEffect(() => {
    // Never auto-seed welcome HTML into a live Y.Doc — setContent races WS sync
    // and has wiped collaborative edits on refresh. Welcome copy is seeded in SQLite.
    if (!editor || !pendingContent || seededRef.current) return;

    let cancelled = false;
    const tryInject = async () => {
      if (cancelled || seededRef.current) return;
      await crdt.waitUntilReadyForSeed();
      if (cancelled || seededRef.current) return;

      if (crdt.isContentEmpty()) {
        editor.commands.setContent(pendingContent);
        updateStatistics(editor);
      }
      seededRef.current = true;
      setPendingContent(null);
    };

    void tryInject();
    return () => {
      cancelled = true;
    };
  }, [editor, pendingContent, crdt, setPendingContent]);

  useEffect(() => {
    const prev = prevSyncRef.current;
    prevSyncRef.current = syncStatus;
    if (prev && prev !== 'synced' && syncStatus === 'synced') {
      setSettling(true);
      setMergeFlash(true);
      const t1 = window.setTimeout(() => setSettling(false), 700);
      const t2 = window.setTimeout(() => setMergeFlash(false), 900);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
  }, [syncStatus]);

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 ptx-desk relative select-text ${
        isForked ? 'ptx-desk--forked' : ''
      }`}
    >
      {mergeFlash && <div className="ptx-merge-flash" aria-hidden />}
      {!canEdit && (
        <div className="shrink-0 px-4 py-2.5 border-b border-white/10 bg-black/30 text-center text-xs font-mono uppercase tracking-widest text-accent relative z-10">
          View only — signal is receive-only on this desk.
        </div>
      )}
      <div className="shrink-0 z-20 relative">
        <DocsToolbar editor={editor} zoom={zoom} onZoomChange={setZoom} />
      </div>
      <div className="shrink-0 z-10 relative">
        <DocsRuler />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto py-10 px-4 flex justify-center min-h-0 relative z-[2]">
        <div
          ref={editorRef}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            width: pageWidthPx,
          }}
          className="transition-transform duration-200 ease-out mb-24 shrink-0"
        >
          <div
            className={`editorial-paper relative ${settling ? 'editorial-paper--settle' : ''}`}
            style={{
              width: pageWidthPx,
              minHeight: pageHeightPx,
              paddingLeft: padLeft,
              paddingRight: padRight,
              paddingTop: padTop,
              paddingBottom: padBottom,
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {displayLiveWordCount && (
        <div className="fixed bottom-5 left-6 z-40 bg-chrome text-accent border border-accent/20 rounded-xl px-4 py-2.5 shadow-lift text-xs flex items-center gap-3 font-mono uppercase tracking-wide animate-fade-scale">
          <span>
            <strong className="text-chrome-fg">{stats.words}</strong> words
          </span>
          <span className="text-chrome-muted">·</span>
          <span>
            <strong className="text-chrome-fg">{stats.chars}</strong> chars
          </span>
          <span className="text-chrome-muted">·</span>
          <span>
            Page <strong className="text-chrome-fg">~{stats.pages}</strong>
          </span>
        </div>
      )}

      <ModalProvider
        stats={stats}
        displayLiveWordCount={displayLiveWordCount}
        onToggleDisplayLiveWordCount={setDisplayLiveWordCount}
      />
    </div>
  );
};
