import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { yUndoPluginKey } from 'y-prosemirror';
import { useModal } from '@/store/modal-store';
import { promptDialog } from '@/store/dialog-store';
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
import { PortalMenu } from '@/components/toolbar/PortalMenu';
import { FONTS, STYLES, TEXT_COLORS, HIGHLIGHT_COLORS } from '@/components/toolbar/constants';
import { collectMarksFromSelection, type CopiedMark } from '@/components/toolbar/format-marks';

interface DocsToolbarProps {
  editor: Editor | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export const DocsToolbar: React.FC<DocsToolbarProps> = ({ editor, zoom, onZoomChange }) => {
  const wordCountModal = useModal('word-count');

  const [fontSize, setFontSize] = useState(11);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#f5e6a8');
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
    setHighlightColor('#f5e6a8');
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
      className="ptx-toolbar DocsToolbar w-full shrink-0 px-3 py-2 flex flex-wrap items-center gap-0.5 text-chrome-fg text-xs select-none z-20 overflow-visible rounded-none border-0 transition-all relative"
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
        onClick={() => {
          document.querySelectorAll('[data-header-menu],[data-toolbar-portal-menu]').forEach((el) => el.remove());
          requestAnimationFrame(() => window.print());
        }}
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
              {TEXT_COLORS.map((c) => (
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
        onClick={async () => {
          const url = await promptDialog({
            title: 'Insert link',
            message: 'Paste a URL to apply to the current selection.',
            placeholder: 'https://…',
            confirmLabel: 'Insert link',
            inputType: 'url',
          });
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
                    setImage?: (attrs: { src: string; alt: string; width?: number }) => {
                      run: () => boolean;
                    };
                  };
                  const inserted = chain.setImage?.({ src: dataUrl, alt: file.name })?.run?.();
                  if (!inserted) {
                    editor
                      .chain()
                      .focus()
                      .insertContent({
                        type: 'image',
                        attrs: { src: dataUrl, alt: file.name },
                      })
                      .run();
                  }
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
            onClick={async () => {
              const url = await promptDialog({
                title: 'Insert image',
                message: 'Paste an image URL to embed in the document.',
                placeholder: 'https://…',
                confirmLabel: 'Insert image',
                inputType: 'url',
              });
              if (url) {
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: 'image',
                    attrs: { src: url, alt: 'image' },
                  })
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
