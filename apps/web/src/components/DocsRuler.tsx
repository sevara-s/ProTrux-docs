import React, { useCallback, useRef, useState } from 'react';
import { INCH, inchesToPx, usePageStore } from '@/store/page-store';

/**
 * Google Docs–style horizontal ruler locked to the page width,
 * with draggable left / right margin guides.
 */
export const DocsRuler: React.FC = () => {
  const widthIn = usePageStore((s) => s.widthIn);
  const marginLeftIn = usePageStore((s) => s.marginLeftIn);
  const marginRightIn = usePageStore((s) => s.marginRightIn);
  const setMargins = usePageStore((s) => s.setMargins);

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'left' | 'right' | null>(null);

  const widthPx = inchesToPx(widthIn);
  const leftPx = inchesToPx(marginLeftIn);
  const rightPx = inchesToPx(marginRightIn);
  const contentWidthPx = Math.max(0, widthPx - leftPx - rightPx);

  const ticks = [];
  const majorEvery = 1;
  const minorEvery = 0.125;
  for (let inch = 0; inch <= widthIn + 0.001; inch = Math.round((inch + minorEvery) * 1000) / 1000) {
    const isMajor = Math.abs(inch % majorEvery) < 0.001 || Math.abs(inch % majorEvery - majorEvery) < 0.001;
    const isHalf = !isMajor && Math.abs((inch * 2) % 1) < 0.001;
    ticks.push({
      inch,
      left: inchesToPx(inch),
      kind: isMajor ? 'major' : isHalf ? 'half' : 'minor',
    });
  }

  const onPointerMove = useCallback(
    (clientX: number, edge: 'left' | 'right') => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const xIn = (clientX - rect.left) / INCH;

      if (edge === 'left') {
        setMargins({ left: xIn });
      } else {
        setMargins({ right: widthIn - xIn });
      }
    },
    [setMargins, widthIn]
  );

  const startDrag = (edge: 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(edge);
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => onPointerMove(ev.clientX, edge);
    const onUp = () => {
      setDragging(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="ptx-ruler shrink-0 select-none border-b border-line bg-muted/80">
      <div className="w-full flex justify-center px-4 py-0">
        <div
          ref={trackRef}
          className="relative h-5 bg-elevated"
          style={{ width: widthPx }}
        >
          {/* Non-writable (margin) regions */}
          <div
            className="absolute inset-y-0 left-0 bg-muted/90 pointer-events-none"
            style={{ width: leftPx }}
          />
          <div
            className="absolute inset-y-0 right-0 bg-muted/90 pointer-events-none"
            style={{ width: rightPx }}
          />

          {/* Writable band */}
          <div
            className="absolute inset-y-0 bg-elevated pointer-events-none"
            style={{ left: leftPx, width: contentWidthPx }}
          />

          {/* Tick marks */}
          {ticks.map((t) => (
            <div
              key={t.inch}
              className="absolute bottom-0 flex flex-col items-center pointer-events-none"
              style={{ left: t.left, transform: 'translateX(-50%)' }}
            >
              {t.kind === 'major' && t.inch > 0 && t.inch < widthIn && (
                <span className="text-[9px] leading-none text-fg-muted mb-0.5 tabular-nums">
                  {Math.round(t.inch)}
                </span>
              )}
              <span
                className={`w-px bg-fg-muted/70 ${
                  t.kind === 'major' ? 'h-2.5' : t.kind === 'half' ? 'h-2' : 'h-1'
                }`}
              />
            </div>
          ))}

          {/* Left margin handle */}
          <button
            type="button"
            aria-label="Left margin"
            title={`Left margin ${marginLeftIn.toFixed(2)}"`}
            onPointerDown={startDrag('left')}
            className={`ptx-ruler-handle absolute top-0 bottom-0 z-10 w-2 -ml-1 cursor-ew-resize ${
              dragging === 'left' ? 'opacity-100' : ''
            }`}
            style={{ left: leftPx }}
          >
            <span className="ptx-ruler-handle__cap" />
          </button>

          {/* Right margin handle */}
          <button
            type="button"
            aria-label="Right margin"
            title={`Right margin ${marginRightIn.toFixed(2)}"`}
            onPointerDown={startDrag('right')}
            className={`ptx-ruler-handle absolute top-0 bottom-0 z-10 w-2 -ml-1 cursor-ew-resize ${
              dragging === 'right' ? 'opacity-100' : ''
            }`}
            style={{ left: widthPx - rightPx }}
          >
            <span className="ptx-ruler-handle__cap" />
          </button>
        </div>
      </div>
    </div>
  );
};

/** @deprecated Alias kept for older imports. */
export const FolioRail = DocsRuler;
