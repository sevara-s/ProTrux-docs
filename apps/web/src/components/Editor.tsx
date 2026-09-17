import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
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
import Image from '@tiptap/extension-image';
import { CRDTManager } from '../services/crdt';
import { DocsToolbar } from './DocsToolbar';
import { FolioRail } from './DocsRuler';
import { ModalProvider } from '@/providers/modal-provider';
import { useDocumentStore } from '@/store/document-store';
import { DEFAULT_DOCUMENT_CONTENT } from '@protrux/shared';

/** Inline font-size mark for the format dock. */
export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }: any) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        },
    } as any;
  },
});

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

  const editorRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);
  const pendingContent = useDocumentStore((state) => state.pendingContent);
  const setPendingContent = useDocumentStore((state) => state.setPendingContent);

  const editor = useEditor(
    {
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
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
      ],
      editorProps: {
        attributes: {
          class: 'editorial-content focus:outline-none min-h-[70vh] text-paper-ink',
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
    if (editor && onEditorReady) {
      queueMicrotask(() => {
        onEditorReady(editor);
        updateStatistics(editor);
      });
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor || !pendingContent || seededRef.current) return;

    let cancelled = false;
    const tryInject = () => {
      if (cancelled || seededRef.current) return;
      if (!crdt.isLocalReady) {
        setTimeout(tryInject, 50);
        return;
      }
      if (editor.isEmpty) {
        editor.commands.setContent(pendingContent);
        updateStatistics(editor);
      }
      seededRef.current = true;
      setPendingContent(null);
    };

    const timer = setTimeout(tryInject, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editor, pendingContent, crdt, setPendingContent]);

  useEffect(() => {
    if (!editor || crdt.docId !== 'welcome-doc' || pendingContent || seededRef.current) return;

    let cancelled = false;
    const trySeed = () => {
      if (cancelled || seededRef.current) return;
      if (!crdt.isLocalReady) {
        setTimeout(trySeed, 50);
        return;
      }
      setTimeout(() => {
        if (cancelled || seededRef.current) return;
        if (editor.isEmpty) {
          editor.commands.setContent(DEFAULT_DOCUMENT_CONTENT);
          updateStatistics(editor);
        }
        seededRef.current = true;
      }, 400);
    };

    const timer = setTimeout(trySeed, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editor, crdt, pendingContent]);

  return (
    <div className="flex-1 flex flex-col min-h-0 ptx-desk relative select-text">
      <DocsToolbar editor={editor} zoom={zoom} onZoomChange={setZoom} />
      <FolioRail />

      <div className="flex-1 overflow-y-auto overflow-x-auto py-8 px-4 flex justify-center">
        <div
          ref={editorRef}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-200 ease-out mb-24 animate-rise-in w-full max-w-[42rem]"
        >
          <div className="editorial-paper w-full min-h-[70vh] px-8 sm:px-12 py-10 sm:py-14 relative">
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
