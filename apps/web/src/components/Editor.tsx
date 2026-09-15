import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { CRDTManager } from '../services/crdt';
import { Toolbar } from './Toolbar';
import { DEFAULT_DOCUMENT_CONTENT } from '@protrux/shared';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading2,
  FileCheck2,
  HardDrive,
} from 'lucide-react';

interface EditorProps {
  crdt: CRDTManager;
  onEditorReady?: (editor: any) => void;
}

export const Editor: React.FC<EditorProps> = ({ crdt, onEditorReady }) => {
  const [stats, setStats] = useState({ words: 0, chars: 0, readTime: 1 });
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize Tiptap with Yjs Collaboration bindings
  const editor = useEditor(
    {
      extensions: [
        // CRDT Collaboration replaces local ProseMirror history
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
          placeholder: 'Write an editorial masterpiece, press Enter for new line...',
        }),
        Underline,
        Highlight.configure({
          multicolor: true,
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
      ],
      editorProps: {
        attributes: {
          class: 'prose-paper max-w-none focus:outline-none min-h-[600px] text-stone-900',
        },
      },
      onUpdate({ editor }) {
        const text = editor.getText();
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const readTime = Math.max(1, Math.ceil(words / 200));
        setStats({ words, chars, readTime });
      },
    },
    [crdt.docId]
  );

  // Listen for IndexedDB hydration completion
  useEffect(() => {
    const handleSynced = () => {
      setIsHydrated(true);
    };

    if (crdt.idbPersistence) {
      crdt.idbPersistence.once('synced', handleSynced);
    }
  }, [crdt]);

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Seed default content if welcome doc is empty
  useEffect(() => {
    if (editor && crdt.docId === 'welcome-doc') {
      const timer = setTimeout(() => {
        if (editor.isEmpty) {
          editor.commands.setContent(DEFAULT_DOCUMENT_CONTENT);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [editor, crdt.docId]);

  // Update cursor user information if profile changes
  useEffect(() => {
    if (editor && crdt.provider) {
      crdt.provider.awareness.setLocalStateField('user', {
        name: crdt.user.name,
        color: crdt.user.color,
      });
    }
  }, [editor, crdt.user]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-paper-100 relative">
      {/* Persistent Formatting Toolbar */}
      <Toolbar editor={editor} />

      {/* Floating Bubble Menu on Selection */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 150 }}
          className="flex items-center gap-1 bg-stone-900 text-stone-100 px-2 py-1 rounded-lg shadow-xl border border-stone-700 text-xs"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-stone-800 ${editor.isActive('bold') ? 'text-indigo-400 font-bold' : ''}`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-stone-800 ${editor.isActive('italic') ? 'text-indigo-400 font-bold' : ''}`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-stone-800 ${editor.isActive('underline') ? 'text-indigo-400 font-bold' : ''}`}
            title="Underline"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1 rounded hover:bg-stone-800 ${editor.isActive('strike') ? 'text-indigo-400 font-bold' : ''}`}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1 rounded hover:bg-stone-800 ${editor.isActive('code') ? 'text-indigo-400 font-bold' : ''}`}
            title="Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-stone-700 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1 rounded hover:bg-stone-800 ${editor.isActive('heading', { level: 2 }) ? 'text-indigo-400 font-bold' : ''}`}
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
        </BubbleMenu>
      )}

      {/* Editorial Canvas Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 md:py-12 flex justify-center">
        <div className="w-full max-w-3xl bg-white border border-stone-200/80 rounded-xl shadow-xs px-8 md:px-14 py-12 min-h-[750px] transition-shadow hover:shadow-md">
          <EditorContent editor={editor} />
        </div>
      </main>

      {/* Status & Telemetry Footer */}
      <footer className="h-8 bg-paper-50 border-t border-stone-200 px-6 flex items-center justify-between text-[11px] text-stone-500 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3 h-3 text-emerald-600" />
            <span>IndexedDB Durability Active</span>
          </span>
          <span className="hidden sm:inline text-stone-300">|</span>
          <span className="hidden sm:flex items-center gap-1">
            <FileCheck2 className="w-3 h-3 text-stone-400" />
            <span>CRDT Vector Interleaving</span>
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span>{stats.words} words</span>
          <span className="text-stone-300">·</span>
          <span>{stats.chars} characters</span>
          <span className="text-stone-300">·</span>
          <span>~{stats.readTime} min read</span>
        </div>
      </footer>
    </div>
  );
};
