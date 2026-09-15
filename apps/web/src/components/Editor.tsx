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
import { DocsRuler } from './DocsRuler';
import { ModalProvider } from '@/providers/modal-provider';
import { DEFAULT_DOCUMENT_CONTENT } from '@protrux/shared';

// Google Docs Font Size Extension (applied to textStyle)
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

export const Editor: React.FC<EditorProps> = ({
  crdt,
  onEditorReady,
}) => {
  const [zoom, setZoom] = useState(100);
  const [displayLiveWordCount, setDisplayLiveWordCount] = useState(false);
  const [stats, setStats] = useState({
    words: 0,
    chars: 0,
    charsNoSpaces: 0,
    pages: 1,
  });

  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize Tiptap with full Google Docs feature set and Yjs CRDT bindings
  const editor = useEditor(
    {
      extensions: [
        // CRDT Collaboration manages history and state synchronization
        StarterKit.configure({
          history: false,
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
          placeholder: 'Type @ to insert, or start typing...',
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
          class: 'editorial-content focus:outline-none min-h-[912px] text-stone-900',
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
    [crdt.docId]
  );

  const updateStatistics = (currentEditor: any) => {
    const text = currentEditor.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    // Calculate estimated pages (approx 500 words or 3000 chars per standard page)
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

  // Seed default content if welcome doc is empty
  useEffect(() => {
    if (editor && crdt.docId === 'welcome-doc') {
      const timer = setTimeout(() => {
        if (editor.isEmpty) {
          editor.commands.setContent(DEFAULT_DOCUMENT_CONTENT);
          updateStatistics(editor);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [editor, crdt.docId]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f7f6f2] relative select-text">
      {/* ProTrux Editorial Command Dock */}
      <DocsToolbar editor={editor} zoom={zoom} onZoomChange={setZoom} />

      {/* Measurement Ruler */}
      <DocsRuler />

      {/* Infinite / Paginated Document Canvas */}
      <div className="flex-1 overflow-y-auto overflow-x-auto py-8 px-4 flex justify-center bg-[#f7f6f2]">
        <div
          ref={editorRef}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-100 ease-out mb-16"
        >
          {/* ProTrux Editorial Paper Sheet */}
          <div className="editorial-paper w-[816px] min-h-[1056px] bg-white px-[72px] py-[72px] relative">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Floating Word Count Telemetry Pill (when toggled in Word Count dialog) */}
      {displayLiveWordCount && (
        <div className="fixed bottom-5 left-6 z-40 bg-stone-900/90 text-stone-100 backdrop-blur-md border border-stone-700/60 rounded-full px-4 py-1.5 shadow-xl text-xs flex items-center gap-3 font-medium">
          <span><strong>{stats.words}</strong> words</span>
          <span className="text-stone-500">·</span>
          <span><strong>{stats.chars}</strong> chars</span>
          <span className="text-stone-500">·</span>
          <span>Page <strong>1</strong> of {stats.pages}</span>
        </div>
      )}

      {/* Google Docs Global Modals (Word count & Share) */}
      <ModalProvider
        stats={stats}
        displayLiveWordCount={displayLiveWordCount}
        onToggleDisplayLiveWordCount={setDisplayLiveWordCount}
      />
    </div>
  );
};
