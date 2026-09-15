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
  const lastSelectionRef = useRef<{ from: number; to: number } | null>(null);

  // Sync toolbar indicators with current cursor and editor state
  useEffect(() => {
    if (!editor) return;

    const onUpdate = () => {
      const { from, to } = editor.state.selection;
      lastSelectionRef.current = { from, to };

      // Update text color indicator
      const activeColor = editor.getAttributes('textStyle').color;
      if (activeColor) {
        setTextColor(activeColor);
      } else {
        setTextColor('#000000');
      }

      // Update highlight color indicator
      const activeHighlight = editor.getAttributes('highlight').color;
      if (activeHighlight) {
        setHighlightColor(activeHighlight);
      }

      // Update font size indicator
      const activeSize = (editor.getAttributes('textStyle') as any).fontSize;
      if (activeSize) {
        const parsed = parseInt(activeSize, 10);
        if (!isNaN(parsed)) setFontSize(parsed);
      }
    };

    editor.on('selectionUpdate', onUpdate);
    editor.on('transaction', onUpdate);

    return () => {
      editor.off('selectionUpdate', onUpdate);
      editor.off('transaction', onUpdate);
    };
  }, [editor]);

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

  const restoreSelection = (chain: any) => {
    if (!editor) return chain;
    // If current editor selection is already a range, leave it
    if (!editor.state.selection.empty) {
      return chain;
    }
    // If editor selection collapsed on blur, restore the last known selection
    if (lastSelectionRef.current && lastSelectionRef.current.from !== lastSelectionRef.current.to) {
      chain.setTextSelection(lastSelectionRef.current);
    }
    return chain;
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(6, Math.min(96, fontSize + delta));
    setFontSize(newSize);
    if (editor) {
      const chain = editor.chain().focus() as any;
      restoreSelection(chain);
      chain.setFontSize?.(`${newSize}pt`)?.run?.();
    }
  };

  const handleSetExactFontSize = (sizeNum: number) => {
    const size = Math.max(6, Math.min(96, sizeNum));
    setFontSize(size);
    if (editor) {
      const chain = editor.chain().focus() as any;
      restoreSelection(chain);
      chain.setFontSize?.(`${size}pt`)?.run?.();
    }
  };

  const handleApplyColor = (color: string) => {
    setTextColor(color);
    if (editor) {
      const chain = editor.chain().focus();
      restoreSelection(chain);
      chain.setColor(color).run();
    }
    setActiveDropdown(null);
  };

  const handleResetColor = () => {
    setTextColor('#000000');
    if (editor) {
      const chain = editor.chain().focus();
      restoreSelection(chain);
      chain.unsetColor().run();
    }
    setActiveDropdown(null);
  };

  const handleApplyHighlight = (color: string) => {
    setHighlightColor(color);
    if (editor) {
      const chain = editor.chain().focus();
      restoreSelection(chain);
      chain.setHighlight({ color }).run();
    }
    setActiveDropdown(null);
  };

  const handleResetHighlight = () => {
    setHighlightColor('#ffff00');
    if (editor) {
      const chain = editor.chain().focus();
      restoreSelection(chain);
      chain.unsetHighlight().run();
    }
    setActiveDropdown(null);
  };

  return (
    <div
      ref={toolbarRef}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && !target.closest('input')) {
          e.preventDefault();
        }
      }}
      className="bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-full mx-auto max-w-5xl my-2 px-3.5 py-1.5 flex items-center gap-0.5 text-stone-700 text-xs shadow-xs select-none sticky top-14 z-20 overflow-visible transition-all"
    >
      {/* Undo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-700 transition-colors disabled:opacity-30"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      {/* Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-700 transition-colors disabled:opacity-30"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      {/* Print */}
      <button
        type="button"
        onClick={() => window.print()}
        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-700 transition-colors"
        title="Print (Ctrl+P)"
      >
        <Printer className="w-4 h-4" />
      </button>

      {/* Spellcheck */}
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-700 transition-colors"
        title="Spelling and grammar check"
      >
        <CheckCheck className="w-4 h-4" />
      </button>

      {/* Paint format */}
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-700 transition-colors"
        title="Paint format"
      >
        <Paintbrush className="w-4 h-4" />
      </button>

      {/* Zoom Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'zoom' ? null : 'zoom')}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-stone-100 text-stone-700 font-medium transition-colors"
        >
          <span>{zoom}%</span>
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>
        {activeDropdown === 'zoom' && (
          <div className="absolute left-0 mt-1.5 w-24 bg-white rounded-xl shadow-xl border border-stone-200/90 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            {[50, 75, 90, 100, 125, 150].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => { onZoomChange(z); setActiveDropdown(null); }}
                className="w-full px-3 py-1 text-left hover:bg-stone-100 text-stone-700 text-xs transition-colors"
              >
                {z}%
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-stone-200 mx-1 shrink-0" />

      {/* Styles Dropdown (Normal text / Headings) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'styles' ? null : 'styles')}
          className="flex items-center justify-between w-28 px-2 py-1 rounded-md hover:bg-stone-100 text-stone-700 font-medium truncate transition-colors"
        >
          <span className="truncate">{currentStyleLabel()}</span>
          <ChevronDown className="w-3 h-3 text-stone-400 shrink-0 ml-1" />
        </button>
        {activeDropdown === 'styles' && (
          <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-stone-200/90 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            {STYLES.map((st) => (
              <button
                key={st.label}
                type="button"
                onClick={() => { st.command(editor); setActiveDropdown(null); }}
                className="w-full px-3 py-1.5 text-left hover:bg-stone-100 text-stone-700 text-xs transition-colors flex items-center justify-between"
              >
                <span>{st.label}</span>
                {st.isActive(editor) && <span className="text-indigo-600 font-bold">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-stone-200 mx-1 shrink-0" />

      {/* Font Family Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'font' ? null : 'font')}
          className="flex items-center justify-between w-24 px-2 py-1 rounded-md hover:bg-stone-100 text-stone-700 font-medium truncate transition-colors"
        >
          <span className="truncate">Inter</span>
          <ChevronDown className="w-3 h-3 text-stone-400 shrink-0 ml-1" />
        </button>
        {activeDropdown === 'font' && (
          <div className="absolute left-0 mt-1.5 w-40 bg-white rounded-xl shadow-xl border border-stone-200/90 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            {FONTS.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => {
                  editor.chain().focus().setFontFamily(f.value).run();
                  setActiveDropdown(null);
                }}
                style={{ fontFamily: f.value }}
                className="w-full px-3 py-1.5 text-left hover:bg-stone-100 text-stone-700 text-xs transition-colors"
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-stone-200 mx-1 shrink-0" />

      {/* Font Size Selector (- 11 +) */}
      <div className="flex items-center">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFontSizeChange(-1)}
          className="p-1 rounded hover:bg-stone-100 text-stone-600 transition-colors"
          title="Decrease font size"
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="text"
          value={fontSize}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (!isNaN(val)) handleSetExactFontSize(val);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              editor?.chain().focus().run();
            }
          }}
          className="w-7 text-center bg-stone-50 border border-stone-200 rounded px-0.5 py-0.5 text-xs mx-0.5 outline-none font-medium text-stone-800 focus:border-indigo-500 focus:bg-white"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFontSizeChange(1)}
          className="p-1 rounded hover:bg-stone-100 text-stone-600 transition-colors"
          title="Increase font size"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="w-[1px] h-4 bg-stone-200 mx-1 shrink-0" />

      {/* Bold */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${editor.isActive('bold') ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-stone-700'}`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${editor.isActive('italic') ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-stone-700'}`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      {/* Underline */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${editor.isActive('underline') ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-stone-700'}`}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>

      {/* Text Color */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setActiveDropdown(activeDropdown === 'color' ? null : 'color')}
          className={`p-1.5 rounded-md hover:bg-stone-100 flex flex-col items-center transition-colors ${activeDropdown === 'color' ? 'bg-indigo-50 text-indigo-600' : 'text-stone-700'}`}
          title="Text color"
        >
          <span className="font-bold text-xs leading-none">A</span>
          <div className="w-3.5 h-1 mt-0.5 rounded-xs" style={{ backgroundColor: textColor }} />
        </button>
        {activeDropdown === 'color' && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="absolute left-0 mt-1.5 p-2 bg-white rounded-xl shadow-xl border border-stone-200/90 z-50 w-52 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-stone-500 font-bold tracking-wider">TEXT COLOR</span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleResetColor}
                className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-10 gap-1 mb-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleApplyColor(c)}
                  className={`w-4 h-4 rounded-full border border-black/15 hover:scale-125 transition-transform ${textColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="pt-1.5 border-t border-stone-200 flex items-center justify-between">
              <span className="text-[10px] text-stone-500 font-medium">Custom color:</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleApplyColor(e.target.value)}
                className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                title="Custom color"
              />
            </div>
          </div>
        )}
      </div>

      {/* Highlight Color */}
      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setActiveDropdown(activeDropdown === 'highlight' ? null : 'highlight')}
          className={`p-1.5 rounded-md hover:bg-stone-100 flex flex-col items-center transition-colors ${activeDropdown === 'highlight' ? 'bg-indigo-50 text-indigo-600' : 'text-stone-700'}`}
          title="Highlight color"
        >
          <Highlighter className="w-4 h-4" />
          <div className="w-3.5 h-0.5 mt-0.5 rounded-xs" style={{ backgroundColor: highlightColor }} />
        </button>
        {activeDropdown === 'highlight' && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="absolute left-0 mt-1.5 p-2 bg-white rounded-xl shadow-xl border border-stone-200/90 z-50 w-52 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-stone-500 font-bold tracking-wider">HIGHLIGHT COLOR</span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleResetHighlight}
                className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
              >
                None
              </button>
            </div>
            <div className="grid grid-cols-10 gap-1 mb-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleApplyHighlight(c)}
                  className={`w-4 h-4 rounded-xs border border-black/15 hover:scale-125 transition-transform ${highlightColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="pt-1.5 border-t border-stone-200 flex items-center justify-between">
              <span className="text-[10px] text-stone-500 font-medium">Custom highlight:</span>
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => handleApplyHighlight(e.target.value)}
                className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                title="Custom highlight"
              />
            </div>
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-stone-200 mx-1 shrink-0" />

      {/* Insert Link */}
      <button
        type="button"
        onClick={() => {
          const url = window.prompt('Enter link URL:');
          if (url) (editor.chain().focus() as any).setLink({ href: url }).run();
        }}
        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-700 transition-colors"
        title="Insert link (Ctrl+K)"
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      {/* Add comment */}
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-700 transition-colors"
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
          className="p-1.5 rounded-md hover:bg-stone-100 text-stone-700 flex items-center gap-0.5 transition-colors"
          title="Insert image"
        >
          <ImageIcon className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 text-stone-400" />
        </button>

        {activeDropdown === 'image' && (
          <div className="absolute left-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-stone-200/90 py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={() => {
                document.getElementById('toolbar-image-upload')?.click();
                setActiveDropdown(null);
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-stone-100 text-stone-700 text-left transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
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
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-stone-100 text-stone-700 text-left transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5 text-stone-500" />
              <span>By URL</span>
            </button>
          </div>
        )}
      </div>

      <div className="w-[1px] h-4 bg-stone-200 mx-1 shrink-0" />

      {/* Align Left */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-stone-700'}`}
        title="Align left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>

      {/* Align Center */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-stone-700'}`}
        title="Align center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>

      {/* Align Right */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-stone-700'}`}
        title="Align right"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      {/* Align Justify */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-stone-700'}`}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-4 bg-stone-200 mx-1 shrink-0" />

      {/* Checklist */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${editor.isActive('taskList') ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-stone-700'}`}
        title="Checklist"
      >
        <CheckSquare className="w-4 h-4" />
      </button>

      {/* Bullet list */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${editor.isActive('bulletList') ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-stone-700'}`}
        title="Bulleted list"
      >
        <List className="w-4 h-4" />
      </button>

      {/* Numbered list */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${editor.isActive('orderedList') ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-stone-700'}`}
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
        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-700 transition-colors"
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
        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-700 transition-colors"
        title="Increase indent"
      >
        <Indent className="w-4 h-4" />
      </button>

      {/* Clear Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-700 transition-colors"
        title="Clear formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-4 bg-stone-200 mx-1 shrink-0" />

      {/* Editing Mode indicator */}
      <div className="ml-auto flex items-center gap-1.5 text-stone-600 px-2.5 py-1 rounded-md hover:bg-stone-100 cursor-pointer font-medium transition-colors">
        <Pencil className="w-3.5 h-3.5 text-stone-500" />
        <span className="hidden lg:inline text-xs">Editing</span>
        <ChevronDown className="w-3 h-3 text-stone-400" />
      </div>
    </div>
  );
};
