import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import { yUndoPluginKey } from 'y-prosemirror';
import { useModal } from '@/store/modal-store';
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
  Activity,
} from 'lucide-react';

interface DocsToolbarProps {
  editor: Editor | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

type CopiedMark = { type: string; attrs: Record<string, unknown> };

const FONTS = [
  { name: 'Source Serif', value: '"Source Serif 4", Georgia, serif' },
  { name: 'Fraunces', value: 'Fraunces, Georgia, serif' },
  { name: 'Manrope', value: 'Manrope, sans-serif' },
  { name: 'IBM Plex Mono', value: '"IBM Plex Mono", monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'System', value: 'system-ui, sans-serif' },
];

const STYLES = [
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

/** Full text + highlight swatches (editor content — not UI chrome) */
const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#3c78d8', '#674ea7', '#a64d79', '#13201c',
];

const HIGHLIGHT_COLORS = [
  '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff9900', '#ff0000', '#4a86e8', '#9900ff',
  '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#d9d2e9', '#ead1dc', '#f4cccc',
  '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#b4a7d6', '#d5a6bd', '#ea9999', '#f9cb9c',
  '#cfe8df', '#fef08a', '#fde68a', '#bbf7d0', '#a5f3fc', '#bfdbfe', '#ddd6fe', '#fecdd3',
];

const COLORS = TEXT_COLORS;

function collectMarksFromSelection(editor: Editor): CopiedMark[] {
  const { from, to, empty } = editor.state.selection;
  const markMap = new Map<string, Record<string, unknown>>();

  if (empty) {
    const marks = editor.state.storedMarks ?? editor.state.selection.$from.marks();
    marks.forEach((m) => markMap.set(m.type.name, { ...m.attrs }));
  } else {
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.isText) {
        node.marks.forEach((m) => markMap.set(m.type.name, { ...m.attrs }));
      }
    });
  }

  return Array.from(markMap.entries()).map(([type, attrs]) => ({ type, attrs }));
}

/** Fixed-position menu so dropdowns aren't clipped by toolbar / presence rail. */
const PortalMenu: React.FC<{
  open: boolean;
  anchor: HTMLElement | null;
  width?: number;
  children: React.ReactNode;
}> = ({ open, anchor, width = 176, children }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const left = Math.min(rect.left, window.innerWidth - width - 8);
      setPos({ top: rect.bottom + 6, left: Math.max(8, left) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchor, width]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-toolbar-portal-menu
      style={{ position: 'fixed', top: pos.top, left: pos.left, width, zIndex: 9999 }}
      className="bg-elevated rounded-xl shadow-lift border border-line py-1 max-h-[min(70vh,320px)] overflow-y-auto"
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </div>,
    document.body
  );
};

export const DocsToolbar: React.FC<DocsToolbarProps> = ({ editor, zoom, onZoomChange }) => {
  const wordCountModal = useModal('word-count');

  const [fontSize, setFontSize] = useState(11);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [spellcheckOn, setSpellcheckOn] = useState(true);
  const [formatPainterArmed, setFormatPainterArmed] = useState(false);
  const [activeFont, setActiveFont] = useState(FONTS[0].name);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const zoomBtnRef = useRef<HTMLButtonElement>(null);
  const stylesBtnRef = useRef<HTMLButtonElement>(null);
  const fontBtnRef = useRef<HTMLButtonElement>(null);
  const colorBtnRef = useRef<HTMLButtonElement>(null);
  const highlightBtnRef = useRef<HTMLButtonElement>(null);
  const imageBtnRef = useRef<HTMLButtonElement>(null);
  const lastSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const formatPainterRef = useRef<{
    marks: CopiedMark[];
    from: number;
    to: number;
  } | null>(null);

  const syncUndoState = useCallback((ed: Editor) => {
    const undoState = yUndoPluginKey.getState(ed.state);
    setCanUndo(Boolean(undoState?.hasUndoOps));
    setCanRedo(Boolean(undoState?.hasRedoOps));
  }, []);

  // Sync toolbar indicators with current cursor and editor state
  useEffect(() => {
    if (!editor) return;

    const onUpdate = () => {
      const { from, to } = editor.state.selection;
      lastSelectionRef.current = { from, to };

      syncUndoState(editor);

      const activeColor = editor.getAttributes('textStyle').color;
      if (activeColor) {
        setTextColor(activeColor);
      } else {
        setTextColor('#000000');
      }

      const activeHighlight = editor.getAttributes('highlight').color;
      if (activeHighlight) {
        setHighlightColor(activeHighlight);
      }

      const activeSize = (editor.getAttributes('textStyle') as { fontSize?: string }).fontSize;
      if (activeSize) {
        const parsed = parseInt(activeSize, 10);
        if (!isNaN(parsed)) setFontSize(parsed);
      }

      const family = editor.getAttributes('textStyle').fontFamily as string | undefined;
      const match = FONTS.find((f) => f.value === family);
      setActiveFont(match?.name ?? FONTS[0].name);
    };

    onUpdate();
    editor.on('selectionUpdate', onUpdate);
    editor.on('transaction', onUpdate);

    return () => {
      editor.off('selectionUpdate', onUpdate);
      editor.off('transaction', onUpdate);
    };
  }, [editor, syncUndoState]);

  // Format painter: apply copied marks on next non-empty selection change
  useEffect(() => {
    if (!editor || !formatPainterArmed) return;

    const onSelectionUpdate = () => {
      const payload = formatPainterRef.current;
      if (!payload) return;

      const { from, to, empty } = editor.state.selection;
      if (empty) return;
      if (from === payload.from && to === payload.to) return;

      let chain = editor.chain().focus().setTextSelection({ from, to }).unsetAllMarks();
      for (const mark of payload.marks) {
        chain = chain.setMark(mark.type, mark.attrs);
      }
      chain.run();

      formatPainterRef.current = null;
      setFormatPainterArmed(false);
    };

    editor.on('selectionUpdate', onSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', onSelectionUpdate);
    };
  }, [editor, formatPainterArmed]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (toolbarRef.current?.contains(target)) return;
      if ((e.target as HTMLElement)?.closest?.('[data-toolbar-portal-menu]')) return;
      setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!editor) return null;

  const currentStyleLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Display';
    if (editor.isActive('heading', { level: 2 })) return 'Section';
    if (editor.isActive('heading', { level: 3 })) return 'Subhead';
    if (editor.isActive('heading', { level: 4 })) return 'Label';
    return 'Body';
  };

  const restoreSelection = (chain: ReturnType<Editor['chain']>) => {
    if (!editor.state.selection.empty) {
      return chain;
    }
    if (lastSelectionRef.current && lastSelectionRef.current.from !== lastSelectionRef.current.to) {
      chain.setTextSelection(lastSelectionRef.current);
    }
    return chain;
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(6, Math.min(96, fontSize + delta));
    setFontSize(newSize);
    const chain = editor.chain().focus() as ReturnType<Editor['chain']> & {
      setFontSize?: (size: string) => ReturnType<Editor['chain']>;
    };
    restoreSelection(chain);
    chain.setFontSize?.(`${newSize}pt`)?.run?.();
  };

  const handleSetExactFontSize = (sizeNum: number) => {
    const size = Math.max(6, Math.min(96, sizeNum));
    setFontSize(size);
    const chain = editor.chain().focus() as ReturnType<Editor['chain']> & {
      setFontSize?: (size: string) => ReturnType<Editor['chain']>;
    };
    restoreSelection(chain);
    chain.setFontSize?.(`${size}pt`)?.run?.();
  };

  const handleApplyColor = (color: string) => {
    setTextColor(color);
    const chain = editor.chain().focus();
    restoreSelection(chain);
    chain.setColor(color).run();
    setActiveDropdown(null);
  };

  const handleResetColor = () => {
    setTextColor('#000000');
    const chain = editor.chain().focus();
    restoreSelection(chain);
    chain.unsetColor().run();
    setActiveDropdown(null);
  };

  const handleApplyHighlight = (color: string) => {
    setHighlightColor(color);
    const chain = editor.chain().focus();
    restoreSelection(chain);
    chain.setHighlight({ color }).run();
    setActiveDropdown(null);
  };

  const handleResetHighlight = () => {
    setHighlightColor('#ffff00');
    const chain = editor.chain().focus();
    restoreSelection(chain);
    chain.unsetHighlight().run();
    setActiveDropdown(null);
  };

  const toggleSpellcheck = () => {
    const next = !spellcheckOn;
    setSpellcheckOn(next);
    editor.view.dom.setAttribute('spellcheck', String(next));
  };

  const handleFormatPainter = () => {
    if (formatPainterArmed) {
      formatPainterRef.current = null;
      setFormatPainterArmed(false);
      return;
    }
    const { from, to } = editor.state.selection;
    const marks = collectMarksFromSelection(editor);
    formatPainterRef.current = { marks, from, to };
    setFormatPainterArmed(true);
  };

  return (
    <div
      ref={toolbarRef}
      onMouseDown={(e) => {
        // Keep editor selection when clicking toolbar controls (not inputs)
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && !target.closest('input')) {
          e.preventDefault();
        }
      }}
      className="ptx-toolbar DocsToolbar mx-3 md:mx-auto max-w-5xl my-2.5 px-3 py-2 flex flex-wrap items-center gap-0.5 text-fg-soft text-xs select-none sticky top-[4.5rem] z-[60] overflow-visible rounded-xl transition-all relative"
    >
      {/* Undo */}
      <button
        type="button"
        onClick={() => editor.commands.undo()}
        disabled={!canUndo}
        className="p-1.5 rounded-md hover:bg-accent-soft text-fg-soft transition-colors disabled:opacity-30"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      {/* Redo */}
      <button
        type="button"
        onClick={() => editor.commands.redo()}
        disabled={!canRedo}
        className="p-1.5 rounded-md hover:bg-accent-soft text-fg-soft transition-colors disabled:opacity-30"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      {/* Print */}
      <button
        type="button"
        onClick={() => window.print()}
        className="p-1.5 rounded-md hover:bg-accent-soft text-fg-soft transition-colors"
        title="Print (Ctrl+P)"
      >
        <Printer className="w-4 h-4" />
      </button>

      {/* Spellcheck */}
      <button
        type="button"
        onClick={toggleSpellcheck}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          spellcheckOn ? 'bg-accent-soft text-accent' : 'text-fg-soft'
        }`}
        title={spellcheckOn ? 'Disable spellcheck' : 'Enable spellcheck'}
      >
        <CheckCheck className="w-4 h-4" />
      </button>

      {/* Format painter */}
      <button
        type="button"
        onClick={handleFormatPainter}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          formatPainterArmed ? 'bg-accent-soft text-accent' : 'text-fg-soft'
        }`}
        title="Paint format"
      >
        <Paintbrush className="w-4 h-4" />
      </button>

      {/* Zoom Dropdown */}
      <div className="relative">
        <button
          ref={zoomBtnRef}
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'zoom' ? null : 'zoom')}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-accent-soft text-fg-soft font-medium transition-colors"
        >
          <span>{zoom}%</span>
          <ChevronDown className="w-3 h-3 text-fg-muted" />
        </button>
        <PortalMenu open={activeDropdown === 'zoom'} anchor={zoomBtnRef.current} width={96}>
          {[50, 75, 90, 100, 125, 150].map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => {
                onZoomChange(z);
                setActiveDropdown(null);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-accent-soft text-fg-soft text-xs transition-colors"
            >
              {z}%
            </button>
          ))}
        </PortalMenu>
      </div>

      <div className="w-[1px] h-4 bg-line mx-1 shrink-0" />

      {/* Styles Dropdown */}
      <div className="relative">
        <button
          ref={stylesBtnRef}
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'styles' ? null : 'styles')}
          className="flex items-center justify-between w-28 px-2 py-1 rounded-md hover:bg-accent-soft text-fg-soft font-medium truncate transition-colors"
        >
          <span className="truncate">{currentStyleLabel()}</span>
          <ChevronDown className="w-3 h-3 text-fg-muted shrink-0 ml-1" />
        </button>
        <PortalMenu open={activeDropdown === 'styles'} anchor={stylesBtnRef.current} width={176}>
          {STYLES.map((st) => (
            <button
              key={st.label}
              type="button"
              onClick={() => {
                st.command(editor);
                setActiveDropdown(null);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-accent-soft text-fg-soft text-xs transition-colors flex items-center justify-between"
            >
              <span>{st.label}</span>
              {st.isActive(editor) && <span className="text-accent font-bold">✓</span>}
            </button>
          ))}
        </PortalMenu>
      </div>

      <div className="w-[1px] h-4 bg-line mx-1 shrink-0" />

      {/* Font Family Selector */}
      <div className="relative">
        <button
          ref={fontBtnRef}
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'font' ? null : 'font')}
          className="flex items-center justify-between w-28 px-2 py-1 rounded-md hover:bg-accent-soft text-fg-soft font-medium truncate transition-colors"
        >
          <span className="truncate">{activeFont}</span>
          <ChevronDown className="w-3 h-3 text-fg-muted shrink-0 ml-1" />
        </button>
        <PortalMenu open={activeDropdown === 'font'} anchor={fontBtnRef.current} width={176}>
          {FONTS.map((f) => (
            <button
              key={f.name}
              type="button"
              onClick={() => {
                editor.chain().focus().setFontFamily(f.value).run();
                setActiveFont(f.name);
                setActiveDropdown(null);
              }}
              style={{ fontFamily: f.value }}
              className="w-full px-3 py-1.5 text-left hover:bg-accent-soft text-fg-soft text-xs transition-colors"
            >
              {f.name}
            </button>
          ))}
        </PortalMenu>
      </div>

      <div className="w-[1px] h-4 bg-line mx-1 shrink-0" />

      {/* Font Size Selector */}
      <div className="flex items-center">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFontSizeChange(-1)}
          className="p-1 rounded hover:bg-accent-soft text-fg-soft transition-colors"
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
              editor.chain().focus().run();
            }
          }}
          className="w-7 text-center bg-muted border border-line rounded px-0.5 py-0.5 text-xs mx-0.5 outline-none font-medium text-fg-soft focus:border-accent focus:bg-elevated"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleFontSizeChange(1)}
          className="p-1 rounded hover:bg-accent-soft text-fg-soft transition-colors"
          title="Increase font size"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="w-[1px] h-4 bg-line mx-1 shrink-0" />

      {/* Bold */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          editor.isActive('bold') ? 'bg-accent-soft text-accent font-semibold' : 'text-fg-soft'
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          editor.isActive('italic') ? 'bg-accent-soft text-accent font-semibold' : 'text-fg-soft'
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      {/* Underline */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          editor.isActive('underline') ? 'bg-accent-soft text-accent font-semibold' : 'text-fg-soft'
        }`}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>

      {/* Text Color */}
      <div className="relative">
        <button
          ref={colorBtnRef}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setActiveDropdown(activeDropdown === 'color' ? null : 'color')}
          className={`p-1.5 rounded-md hover:bg-accent-soft flex flex-col items-center transition-colors ${
            activeDropdown === 'color' ? 'bg-accent-soft text-accent' : 'text-fg-soft'
          }`}
          title="Text color"
        >
          <span className="font-bold text-xs leading-none">A</span>
          <div className="w-3.5 h-1 mt-0.5 rounded-xs" style={{ backgroundColor: textColor }} />
        </button>
        <PortalMenu open={activeDropdown === 'color'} anchor={colorBtnRef.current} width={220}>
          <div className="px-2 py-1.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-fg-muted font-bold tracking-wider">TEXT COLOR</span>
              <button
                type="button"
                onClick={handleResetColor}
                className="text-[10px] text-accent hover:underline font-semibold cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-10 gap-1 mb-2">
              {COLORS.map((c) => (
                <button
                  key={`text-${c}`}
                  type="button"
                  onClick={() => handleApplyColor(c)}
                  className={`w-4 h-4 rounded-full border border-black/15 hover:scale-125 transition-transform ${
                    textColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-accent ring-offset-1' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="pt-1.5 border-t border-line flex items-center justify-between">
              <span className="text-[10px] text-fg-muted font-medium">Custom:</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleApplyColor(e.target.value)}
                className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                title="Custom color"
              />
            </div>
          </div>
        </PortalMenu>
      </div>

      {/* Highlight Color */}
      <div className="relative">
        <button
          ref={highlightBtnRef}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setActiveDropdown(activeDropdown === 'highlight' ? null : 'highlight')}
          className={`p-1.5 rounded-md hover:bg-accent-soft flex flex-col items-center transition-colors ${
            activeDropdown === 'highlight' ? 'bg-accent-soft text-accent' : 'text-fg-soft'
          }`}
          title="Highlight color"
        >
          <Highlighter className="w-4 h-4" />
          <div className="w-3.5 h-0.5 mt-0.5 rounded-xs" style={{ backgroundColor: highlightColor }} />
        </button>
        <PortalMenu open={activeDropdown === 'highlight'} anchor={highlightBtnRef.current} width={220}>
          <div className="px-2 py-1.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-fg-muted font-bold tracking-wider">HIGHLIGHT</span>
              <button
                type="button"
                onClick={handleResetHighlight}
                className="text-[10px] text-accent hover:underline font-semibold cursor-pointer"
              >
                None
              </button>
            </div>
            <div className="grid grid-cols-10 gap-1 mb-2">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={`hl-${c}`}
                  type="button"
                  onClick={() => handleApplyHighlight(c)}
                  className={`w-4 h-4 rounded-xs border border-black/15 hover:scale-125 transition-transform ${
                    highlightColor.toLowerCase() === c.toLowerCase()
                      ? 'ring-2 ring-accent ring-offset-1'
                      : ''
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            <div className="pt-1.5 border-t border-line flex items-center justify-between">
              <span className="text-[10px] text-fg-muted font-medium">Custom:</span>
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => handleApplyHighlight(e.target.value)}
                className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent"
                title="Custom highlight"
              />
            </div>
          </div>
        </PortalMenu>
      </div>

      <div className="w-[1px] h-4 bg-line mx-1 shrink-0" />

      {/* Insert Link */}
      <button
        type="button"
        onClick={() => {
          const url = window.prompt('Enter link URL:');
          if (url) {
            (editor.chain().focus() as ReturnType<Editor['chain']> & {
              setLink: (attrs: { href: string }) => ReturnType<Editor['chain']>;
            })
              .setLink({ href: url })
              .run();
          }
        }}
        className="p-1.5 rounded-md hover:bg-accent-soft text-fg-soft transition-colors"
        title="Insert link (Ctrl+K)"
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      {/* Insert Image */}
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
                  const chain = editor.chain().focus() as ReturnType<Editor['chain']> & {
                    setImage?: (attrs: { src: string; alt: string }) => {
                      run: () => boolean;
                    };
                  };
                  chain.setImage?.({ src: dataUrl, alt: file.name })?.run?.() ||
                    editor
                      .chain()
                      .focus()
                      .insertContent(
                        `<img src="${dataUrl}" alt="${file.name}" style="max-width: 100%; border-radius: 4px;" />`,
                      )
                      .run();
                }
              };
              reader.readAsDataURL(file);
            }
            setActiveDropdown(null);
            e.target.value = '';
          }}
        />
        <button
          ref={imageBtnRef}
          type="button"
          onClick={() => setActiveDropdown(activeDropdown === 'image' ? null : 'image')}
          className="p-1.5 rounded-md hover:bg-accent-soft text-fg-soft flex items-center gap-0.5 transition-colors"
          title="Insert image"
        >
          <ImageIcon className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 text-fg-muted" />
        </button>
        <PortalMenu open={activeDropdown === 'image'} anchor={imageBtnRef.current} width={200}>
          <button
            type="button"
            onClick={() => {
              document.getElementById('toolbar-image-upload')?.click();
              setActiveDropdown(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-accent-soft text-fg-soft text-left transition-colors text-xs"
          >
            <ImageIcon className="w-3.5 h-3.5 text-fg-muted" />
            <span>Upload from computer</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const url = window.prompt('Enter image URL:');
              if (url) {
                editor
                  .chain()
                  .focus()
                  .insertContent(
                    `<img src="${url}" alt="image" style="max-width: 100%; border-radius: 4px;" />`,
                  )
                  .run();
              }
              setActiveDropdown(null);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-accent-soft text-fg-soft text-left transition-colors text-xs"
          >
            <LinkIcon className="w-3.5 h-3.5 text-fg-muted" />
            <span>By URL</span>
          </button>
        </PortalMenu>
      </div>

      <div className="w-[1px] h-4 bg-line mx-1 shrink-0" />

      {/* Align Left */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          editor.isActive({ textAlign: 'left' })
            ? 'bg-accent-soft text-accent font-semibold'
            : 'text-fg-soft'
        }`}
        title="Align left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>

      {/* Align Center */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          editor.isActive({ textAlign: 'center' })
            ? 'bg-accent-soft text-accent font-semibold'
            : 'text-fg-soft'
        }`}
        title="Align center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>

      {/* Align Right */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          editor.isActive({ textAlign: 'right' })
            ? 'bg-accent-soft text-accent font-semibold'
            : 'text-fg-soft'
        }`}
        title="Align right"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      {/* Align Justify */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          editor.isActive({ textAlign: 'justify' })
            ? 'bg-accent-soft text-accent font-semibold'
            : 'text-fg-soft'
        }`}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-4 bg-line mx-1 shrink-0" />

      {/* Checklist */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          editor.isActive('taskList') ? 'bg-accent-soft text-accent font-semibold' : 'text-fg-soft'
        }`}
        title="Checklist"
      >
        <CheckSquare className="w-4 h-4" />
      </button>

      {/* Bullet list */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          editor.isActive('bulletList') ? 'bg-accent-soft text-accent font-semibold' : 'text-fg-soft'
        }`}
        title="Bulleted list"
      >
        <List className="w-4 h-4" />
      </button>

      {/* Numbered list */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-md hover:bg-accent-soft transition-colors ${
          editor.isActive('orderedList') ? 'bg-accent-soft text-accent font-semibold' : 'text-fg-soft'
        }`}
        title="Numbered list"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      {/* Decrease Indent */}
      <button
        type="button"
        onClick={() => {
          const chain = editor.chain().focus() as ReturnType<Editor['chain']> & {
            liftListItem?: (type: string) => ReturnType<Editor['chain']>;
          };
          if (typeof chain.liftListItem === 'function') {
            chain.liftListItem('listItem').run();
          }
        }}
        className="p-1.5 rounded-md hover:bg-accent-soft text-fg-soft transition-colors"
        title="Decrease indent"
      >
        <Outdent className="w-4 h-4" />
      </button>

      {/* Increase Indent */}
      <button
        type="button"
        onClick={() => {
          const chain = editor.chain().focus() as ReturnType<Editor['chain']> & {
            sinkListItem?: (type: string) => ReturnType<Editor['chain']>;
          };
          if (typeof chain.sinkListItem === 'function') {
            chain.sinkListItem('listItem').run();
          }
        }}
        className="p-1.5 rounded-md hover:bg-accent-soft text-fg-soft transition-colors"
        title="Increase indent"
      >
        <Indent className="w-4 h-4" />
      </button>

      {/* Clear Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className="p-1.5 rounded-md hover:bg-accent-soft text-fg-soft transition-colors"
        title="Clear formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>

      {/* Metrics / word count */}
      <button
        type="button"
        onClick={() => wordCountModal.openModal()}
        className="ml-auto flex items-center gap-1.5 text-fg-soft px-2.5 py-1 rounded-md hover:bg-accent-soft font-medium transition-colors"
        title="Document metrics"
      >
        <Activity className="w-3.5 h-3.5 text-fg-muted" />
        <span className="hidden lg:inline text-xs">Metrics</span>
      </button>
    </div>
  );
};
