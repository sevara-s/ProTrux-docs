import type { Editor } from '@tiptap/react';

export const FONTS = [
  { name: 'Source Serif', value: '"Source Serif 4", Georgia, serif' },
  { name: 'Fraunces', value: 'Fraunces, Georgia, serif' },
  { name: 'Manrope', value: 'Manrope, sans-serif' },
  { name: 'IBM Plex Mono', value: '"IBM Plex Mono", monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'System', value: 'system-ui, sans-serif' },
];

export const STYLES = [
  {
    label: 'Body',
    command: (editor: Editor) => editor.chain().focus().setParagraph().run(),
    isActive: (editor: Editor) => editor.isActive('paragraph') && !editor.isActive('heading'),
  },
  {
    label: 'Display',
    command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor: Editor) => editor.isActive('heading', { level: 1 }),
  },
  {
    label: 'Section',
    command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor: Editor) => editor.isActive('heading', { level: 2 }),
  },
  {
    label: 'Subhead',
    command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor: Editor) => editor.isActive('heading', { level: 3 }),
  },
  {
    label: 'Label',
    command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
    isActive: (editor: Editor) => editor.isActive('heading', { level: 4 }),
  },
];

export const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#3c78d8', '#674ea7', '#a64d79', '#13201c',
];

export const HIGHLIGHT_COLORS = [
  '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff9900', '#ff0000', '#4a86e8', '#9900ff',
  '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#d9d2e9', '#ead1dc', '#f4cccc',
  '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#b4a7d6', '#d5a6bd', '#ea9999', '#f9cb9c',
  '#cfe8df', '#fef08a', '#fde68a', '#bbf7d0', '#a5f3fc', '#bfdbfe', '#ddd6fe', '#fecdd3',
];
