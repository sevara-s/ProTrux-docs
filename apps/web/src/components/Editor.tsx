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
import { CRDTManager } from '../services/crdt';
import { DocsToolbar } from './DocsToolbar';
import { DocsRuler } from './DocsRuler';
import { ModalProvider } from '@/providers/modal-provider';
import { DEFAULT_DOCUMENT_CONTENT } from '@protrux/shared';

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
        CollaborationCursor.configure({
          provider: crdt.provider,
          user: {
            name: crdt.user.name,
            color: crdt.user.color,
          },
        }),
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
        FontFamily,
        Link.configure({
          openOnClick: false,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
      ],
      editorProps: {
        attributes: {
          class: 'google-docs-content focus:outline-none min-h-[912px] text-[#202124]',
          spellcheck: 'true',
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
      onEditorReady(editor);
      updateStatistics(editor);
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#f9fbfd] relative select-text">
      {/* Google Docs Action Toolbar */}
      <DocsToolbar editor={editor} zoom={zoom} onZoomChange={setZoom} />

      {/* Google Docs Horizontal Measurement Ruler */}
      <DocsRuler />

      {/* Google Docs Infinite / Paginated Document Canvas */}
      <div className="flex-1 overflow-y-auto overflow-x-auto py-8 px-4 flex justify-center bg-[#f9fbfd]">
        <div
          ref={editorRef}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-100 ease-out mb-16"
        >
          {/* Authentic Google Docs A4 / Letter Paper Sheet */}
          <div className="google-docs-paper w-[816px] min-h-[1056px] bg-white px-[72px] py-[72px] relative">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Floating Word Count Telemetry Pill (when toggled in Word Count dialog) */}
      {displayLiveWordCount && (
        <div className="fixed bottom-4 left-6 z-40 bg-white/95 backdrop-blur border border-[#dadce0] rounded-lg px-3 py-1.5 shadow-md text-xs text-[#5f6368] flex items-center gap-3">
          <span><strong>{stats.words}</strong> words</span>
          <span>·</span>
          <span><strong>{stats.chars}</strong> characters</span>
          <span>·</span>
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
