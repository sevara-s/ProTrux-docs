import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from '@tiptap/extension-image';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'e' | 'w';

const MIN_WIDTH = 48;
const MAX_WIDTH = 1200;

function ResizableImageView({ node, updateAttributes, selected, editor, deleteNode }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const dragRef = useRef<{
    handle: Handle;
    startX: number;
    startWidth: number;
    ratio: number;
  } | null>(null);
  const [liveWidth, setLiveWidth] = useState<number | null>(null);

  const width = liveWidth ?? (typeof node.attrs.width === 'number' ? node.attrs.width : null);
  const editable = editor.isEditable;

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    if (!node.attrs.width && img.naturalWidth) {
      const pageGuess = Math.min(img.naturalWidth, 560);
      updateAttributes({ width: pageGuess });
    }
  };

  const startResize = useCallback(
    (handle: Handle) => (e: React.PointerEvent) => {
      if (!editable) return;
      e.preventDefault();
      e.stopPropagation();
      const img = imgRef.current;
      if (!img) return;
      const startWidth = img.getBoundingClientRect().width;
      const ratio =
        natural.w && natural.h
          ? natural.h / natural.w
          : img.naturalHeight && img.naturalWidth
            ? img.naturalHeight / img.naturalWidth
            : img.height / img.width;

      dragRef.current = { handle, startX: e.clientX, startWidth, ratio };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const delta =
          drag.handle === 'w' || drag.handle === 'nw' || drag.handle === 'sw'
            ? drag.startX - ev.clientX
            : ev.clientX - drag.startX;
        const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(drag.startWidth + delta)));
        setLiveWidth(next);
      };

      const onUp = () => {
        const drag = dragRef.current;
        dragRef.current = null;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        setLiveWidth((current) => {
          if (current != null) {
            updateAttributes({
              width: current,
              height: Math.round(current * (drag?.ratio || 1)),
            });
          }
          return null;
        });
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [editable, natural.h, natural.w, updateAttributes]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected || !editable) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteNode();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, editable, deleteNode]);

  const displayWidth = width ?? undefined;
  const showHandles = selected && editable;

  return (
    <NodeViewWrapper
      as="span"
      className={`ptx-img-wrap${selected ? ' is-selected' : ''}${editable ? ' is-editable' : ''}`}
      data-drag-handle
    >
      <span className="ptx-img-frame" style={{ width: displayWidth ? `${displayWidth}px` : undefined }}>
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          title={node.attrs.title || undefined}
          onLoad={onImgLoad}
          draggable={false}
          style={{
            width: displayWidth ? '100%' : undefined,
            height: 'auto',
            maxWidth: '100%',
          }}
        />
        {showHandles && (
          <>
            <span className="ptx-img-edge ptx-img-edge--w" onPointerDown={startResize('w')} />
            <span className="ptx-img-edge ptx-img-edge--e" onPointerDown={startResize('e')} />
            {(['nw', 'ne', 'sw', 'se'] as Handle[]).map((h) => (
              <span
                key={h}
                className={`ptx-img-handle ptx-img-handle--${h}`}
                onPointerDown={startResize(h)}
              />
            ))}
            {width != null && (
              <span className="ptx-img-size">{Math.round(width)} px</span>
            )}
          </>
        )}
      </span>
    </NodeViewWrapper>
  );
}

/**
 * TipTap Image with Docs-style corner / side resize handles.
 * Stores width (and optional height) as node attributes so size syncs via CRDT.
 */
export const ResizableImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const w =
            element.getAttribute('width') ||
            (element as HTMLElement).style.width?.replace('px', '');
          const n = w ? parseInt(w, 10) : NaN;
          return Number.isFinite(n) ? n : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return {
            width: attributes.width,
            style: `width: ${attributes.width}px; height: auto; max-width: 100%;`,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const h =
            element.getAttribute('height') ||
            (element as HTMLElement).style.height?.replace('px', '');
          const n = h ? parseInt(h, 10) : NaN;
          return Number.isFinite(n) ? n : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView, {
      className: 'ptx-img-node',
    });
  },
});
