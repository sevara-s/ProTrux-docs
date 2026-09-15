import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Undo2,
  Redo2,
  Printer,
  CheckCheck,
  Paintbrush,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Link as LinkIcon,
  MessageSquarePlus,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Outdent,
  Indent,
  RemoveFormatting,
  ChevronDown,
  Minus,
  Plus,
  Pencil,
} from 'lucide-react';

interface DocsToolbarProps {
  editor: Editor | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const FONTS = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Courier New', value: '"Courier New", monospace' },
  { name: 'Inter', value: 'Inter, sans-serif' },
];

const STYLES = [
  { label: 'Normal text', command: (editor: Editor) => editor.chain().focus().setParagraph().run(), isActive: (editor: Editor) => editor.isActive('paragraph') },
  { label: 'Title', command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (editor: Editor) => editor.isActive('heading', { level: 1 }) },
  { label: 'Heading 1', command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (editor: Editor) => editor.isActive('heading', { level: 1 }) },
  { label: 'Heading 2', command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (editor: Editor) => editor.isActive('heading', { level: 2 }) },
  { label: 'Heading 3', command: (editor: Editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (editor: Editor) => editor.isActive('heading', { level: 3 }) },
];

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#1155cc', '#0b5394', '#351c75', '#741b47', '#274e13', '#7f6000', '#a64d79', '#cc0000', '#e69138', '#38761d',
];

export const DocsToolbar: React.FC<DocsToolbarProps> = ({ editor, zoom, onZoomChange }) => {
  const [fontSize, setFontSize] = useState(11);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#ffff00');

  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!editor) return null;

  const currentStyleLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    return 'Normal text';
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(6, Math.min(96, fontSize + delta));
    setFontSize(newSize);
  };

  const handleApplyColor = (color: string) => {
    setTextColor(color);
    editor.chain().focus().setColor(color).run();
    setActiveDropdown(null);
  };

  const handleApplyHighlight = (color: string) => {
    setHighlightColor(color);
    editor.chain().focus().toggleHighlight({ color }).run();
    setActiveDropdown(null);
  };

  return (
    <div
      ref={toolbarRef}
      className="bg-[#edf2fa] rounded-full mx-4 my-1.5 px-3 py-1 flex items-center gap-0.5 text-[#202124] text-xs shadow-2xs select-none sticky top-14 z-20 overflow-x-auto"
    >
      {/* Undo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded-full hover:bg-[#dfe4ea] disabled:opacity-30"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      {/* Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded-full hover:bg-[#dfe4ea] disabled:opacity-30"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      {/* Print */}
      <button
        type="button"
        onClick={() => window.print()}
        className="p-1.5 rounded-full hover:bg-[#dfe4ea]"
        title="Print (Ctrl+P)"
      >
        <Printer className="w-4 h-4" />
      </button>

      {/* Spellcheck */}
      <button
        type="button"
        className="p-1.5 rounded-full hover:bg-[#dfe4ea]"
        title="Spelling and grammar check"
      >
        <CheckCheck className="w-4 h-4" />
      </button>

      {/* Paint format */}
      <button
        type="button"
        className="p-1.5 rounded-full hover:bg-[#dfe4ea]"
        title="Paint format"
      >
        <Paintbrush className="w-4 h-4" />
      </button>

      {/* Zoom Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'zoom' ? null : 'zoom')}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#dfe4ea] font-medium"
        >
          <span>{zoom}%</span>
          <ChevronDown className="w-3 h-3 text-[#5f6368]" />
        </button>
        {activeDropdown === 'zoom' && (
          <div className="absolute left-0 mt-1 w-24 bg-white rounded shadow-md border border-[#dadce0] py-1 z-50">
            {[50, 75, 90, 100, 125, 150].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => { onZoomChange(z); setActiveDropdown(null); }}
                className="w-full px-3 py-1 text-left hover:bg-[#f1f3f4]"
              >
                {z}%
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-5 bg-[#dadce0] mx-1" />

      {/* Styles Dropdown (Normal text / Headings) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'styles' ? null : 'styles')}
          className="flex items-center justify-between w-28 px-2 py-1 rounded hover:bg-[#dfe4ea] font-medium truncate"
        >
          <span className="truncate">{currentStyleLabel()}</span>
          <ChevronDown className="w-3 h-3 text-[#5f6368] shrink-0 ml-1" />
        </button>
        {activeDropdown === 'styles' && (
          <div className="absolute left-0 mt-1 w-44 bg-white rounded shadow-md border border-[#dadce0] py-1 z-50">
            {STYLES.map((st) => (
              <button
                key={st.label}
                type="button"
                onClick={() => { st.command(editor); setActiveDropdown(null); }}
                className="w-full px-3 py-1.5 text-left hover:bg-[#f1f3f4] flex items-center justify-between"
              >
                <span>{st.label}</span>
                {st.isActive(editor) && <span className="text-[#1a73e8]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-5 bg-[#dadce0] mx-1" />

      {/* Font Family Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'font' ? null : 'font')}
          className="flex items-center justify-between w-24 px-2 py-1 rounded hover:bg-[#dfe4ea] font-medium truncate"
        >
          <span className="truncate">Arial</span>
          <ChevronDown className="w-3 h-3 text-[#5f6368] shrink-0 ml-1" />
        </button>
        {activeDropdown === 'font' && (
          <div className="absolute left-0 mt-1 w-40 bg-white rounded shadow-md border border-[#dadce0] py-1 z-50">
            {FONTS.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => {
                  editor.chain().focus().setFontFamily(f.value).run();
                  setActiveDropdown(null);
                }}
                style={{ fontFamily: f.value }}
                className="w-full px-3 py-1.5 text-left hover:bg-[#f1f3f4]"
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-5 bg-[#dadce0] mx-1" />

      {/* Font Size Selector (- 11 +) */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => handleFontSizeChange(-1)}
          className="p-1 rounded hover:bg-[#dfe4ea]"
          title="Decrease font size"
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="text"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value) || 11)}
          className="w-7 text-center bg-white border border-[#dadce0] rounded px-0.5 py-0.5 text-xs mx-0.5 outline-none font-medium"
        />
        <button
          type="button"
          onClick={() => handleFontSizeChange(1)}
          className="p-1 rounded hover:bg-[#dfe4ea]"
          title="Increase font size"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="w-[1px] h-5 bg-[#dadce0] mx-1" />

      {/* Bold */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-[#dfe4ea] ${editor.isActive('bold') ? 'bg-[#d3e3fd] text-[#041e49]' : ''}`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-[#dfe4ea] ${editor.isActive('italic') ? 'bg-[#d3e3fd] text-[#041e49]' : ''}`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      {/* Underline */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-[#dfe4ea] ${editor.isActive('underline') ? 'bg-[#d3e3fd] text-[#041e49]' : ''}`}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>

      {/* Text Color */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'color' ? null : 'color')}
          className="p-1.5 rounded hover:bg-[#dfe4ea] flex flex-col items-center"
          title="Text color"
        >
          <span className="font-bold text-xs leading-none">A</span>
          <div className="w-3.5 h-1 mt-0.5 rounded-xs" style={{ backgroundColor: textColor }} />
        </button>
        {activeDropdown === 'color' && (
          <div className="absolute left-0 mt-1 p-2 bg-white rounded shadow-lg border border-[#dadce0] z-50 w-48">
            <p className="text-[10px] text-[#5f6368] font-medium mb-1.5">TEXT COLOR</p>
            <div className="grid grid-cols-10 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleApplyColor(c)}
                  className="w-4 h-4 rounded-full border border-black/10 hover:scale-125 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Highlight Color */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'highlight' ? null : 'highlight')}
          className="p-1.5 rounded hover:bg-[#dfe4ea] flex flex-col items-center"
          title="Highlight color"
        >
          <Highlighter className="w-4 h-4" />
        </button>
        {activeDropdown === 'highlight' && (
          <div className="absolute left-0 mt-1 p-2 bg-white rounded shadow-lg border border-[#dadce0] z-50 w-48">
            <p className="text-[10px] text-[#5f6368] font-medium mb-1.5">HIGHLIGHT COLOR</p>
            <div className="grid grid-cols-10 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleApplyHighlight(c)}
                  className="w-4 h-4 rounded-xs border border-black/10 hover:scale-125 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-[1px] h-5 bg-[#dadce0] mx-1" />

      {/* Insert Link */}
      <button
        type="button"
        onClick={() => {
          const url = window.prompt('Enter link URL:');
          if (url) (editor.chain().focus() as any).setLink({ href: url }).run();
        }}
        className="p-1.5 rounded hover:bg-[#dfe4ea]"
        title="Insert link (Ctrl+K)"
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      {/* Add comment */}
      <button
        type="button"
        className="p-1.5 rounded hover:bg-[#dfe4ea]"
        title="Add comment"
      >
        <MessageSquarePlus className="w-4 h-4" />
      </button>

      {/* Insert Image with Dropdown and File Upload */}
      <div className="relative">
        <input
          type="file"
          id="toolbar-image-upload"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                if (dataUrl) {
                  (editor.chain().focus() as any).setImage?.({ src: dataUrl, alt: file.name })?.run?.() ||
                    editor.chain().focus().insertContent(`<img src="${dataUrl}" alt="${file.name}" style="max-width: 100%; border-radius: 4px;" />`).run();
                }
              };
              reader.readAsDataURL(file);
            }
            setActiveDropdown(null);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'image' ? null : 'image')}
          className="p-1.5 rounded hover:bg-[#dfe4ea] flex items-center gap-0.5"
          title="Insert image"
        >
          <ImageIcon className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 text-[#5f6368]" />
        </button>

        {activeDropdown === 'image' && (
          <div className="absolute left-0 mt-1 w-48 bg-white rounded shadow-lg border border-[#dadce0] py-1 z-50 text-xs">
            <button
              type="button"
              onClick={() => {
                document.getElementById('toolbar-image-upload')?.click();
                setActiveDropdown(null);
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#f1f3f4] text-left"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#5f6368]" />
              <span>Upload from computer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const url = window.prompt('Enter image URL:');
                if (url) {
                  editor.chain().focus().insertContent(`<img src="${url}" alt="image" style="max-width: 100%; border-radius: 4px;" />`).run();
                }
                setActiveDropdown(null);
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#f1f3f4] text-left"
            >
              <LinkIcon className="w-3.5 h-3.5 text-[#5f6368]" />
              <span>By URL</span>
            </button>
          </div>
        )}
      </div>

      <div className="w-[1px] h-5 bg-[#dadce0] mx-1" />

      {/* Align Left */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1.5 rounded hover:bg-[#dfe4ea] ${editor.isActive({ textAlign: 'left' }) ? 'bg-[#d3e3fd]' : ''}`}
        title="Align left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>

      {/* Align Center */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1.5 rounded hover:bg-[#dfe4ea] ${editor.isActive({ textAlign: 'center' }) ? 'bg-[#d3e3fd]' : ''}`}
        title="Align center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>

      {/* Align Right */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1.5 rounded hover:bg-[#dfe4ea] ${editor.isActive({ textAlign: 'right' }) ? 'bg-[#d3e3fd]' : ''}`}
        title="Align right"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      {/* Align Justify */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`p-1.5 rounded hover:bg-[#dfe4ea] ${editor.isActive({ textAlign: 'justify' }) ? 'bg-[#d3e3fd]' : ''}`}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-5 bg-[#dadce0] mx-1" />

      {/* Checklist */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-1.5 rounded hover:bg-[#dfe4ea] ${editor.isActive('taskList') ? 'bg-[#d3e3fd]' : ''}`}
        title="Checklist"
      >
        <CheckSquare className="w-4 h-4" />
      </button>

      {/* Bullet list */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-[#dfe4ea] ${editor.isActive('bulletList') ? 'bg-[#d3e3fd]' : ''}`}
        title="Bulleted list"
      >
        <List className="w-4 h-4" />
      </button>

      {/* Numbered list */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-[#dfe4ea] ${editor.isActive('orderedList') ? 'bg-[#d3e3fd]' : ''}`}
        title="Numbered list"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      {/* Decrease Indent */}
      <button
        type="button"
        onClick={() => {
          const chain = editor.chain().focus() as any;
          if (typeof chain.liftListItem === 'function') {
            chain.liftListItem('listItem').run();
          }
        }}
        className="p-1.5 rounded hover:bg-[#dfe4ea]"
        title="Decrease indent"
      >
        <Outdent className="w-4 h-4" />
      </button>

      {/* Increase Indent */}
      <button
        type="button"
        onClick={() => {
          const chain = editor.chain().focus() as any;
          if (typeof chain.sinkListItem === 'function') {
            chain.sinkListItem('listItem').run();
          }
        }}
        className="p-1.5 rounded hover:bg-[#dfe4ea]"
        title="Increase indent"
      >
        <Indent className="w-4 h-4" />
      </button>

      {/* Clear Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className="p-1.5 rounded hover:bg-[#dfe4ea]"
        title="Clear formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-5 bg-[#dadce0] mx-1" />

      {/* Editing Mode indicator */}
      <div className="ml-auto flex items-center gap-1 text-[#444746] px-2 py-1 rounded hover:bg-[#dfe4ea] cursor-pointer">
        <Pencil className="w-3.5 h-3.5" />
        <span className="font-medium hidden lg:inline">Editing</span>
        <ChevronDown className="w-3 h-3 text-[#5f6368]" />
      </div>
    </div>
  );
};
