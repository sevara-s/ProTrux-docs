import React, { useCallback, useRef, useState } from 'react';
import { INCH, inchesToPx, usePageStore } from '@/store/page-store';

/**
 * Industrial measure strip locked to page width — Signal desk geometry.
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
  const minorEvery = 0.125;
  for (let inch = 0; inch <= widthIn + 0.001; inch = Math.round((inch + minorEvery) * 1000) / 1000) {
    const isMajor = Math.abs(inch % 1) < 0.001 || Math.abs(inch % 1 - 1) < 0.001;
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
      if (edge === 'left') setMargins({ left: xIn });
      else setMargins({ right: widthIn - xIn });
    },
    [setMargins, widthIn]
  );

  const startDrag = (edge: 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(edge);
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
    <div className="ptx-ruler shrink-0 select-none">
      <div className="w-full flex justify-center px-4 py-0">
        <div ref={trackRef} className="relative h-5" style={{ width: widthPx }}>
          <div className="absolute inset-y-0 left-0 bg-black/[0.06] dark:bg-white/[0.04]" style={{ width: leftPx }} />
          <div className="absolute inset-y-0 right-0 bg-black/[0.06] dark:bg-white/[0.04]" style={{ width: rightPx }} />
          <div
            className="absolute inset-y-0 bg-accent/[0.08] dark:bg-white/[0.07]"
            style={{ left: leftPx, width: contentWidthPx }}
          />

          {ticks.map((t) => (
            <div
              key={t.inch}
              className="absolute bottom-0 flex flex-col items-center pointer-events-none"
              style={{ left: t.left, transform: 'translateX(-50%)' }}
            >
              {t.kind === 'major' && t.inch > 0 && t.inch < widthIn && (
                <span className="text-[8px] leading-none text-black/45 dark:text-white/40 mb-0.5 tabular-nums font-mono">
                  {Math.round(t.inch)}
                </span>
              )}
              <span
                className={`w-px ${
                  t.kind === 'major'
                    ? 'h-2.5 bg-accent/80'
                    : t.kind === 'half'
                      ? 'h-2 bg-black/30 dark:bg-white/35'
                      : 'h-1 bg-black/18 dark:bg-white/20'
                }`}
              />
            </div>
          ))}

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

export const FolioRail = DocsRuler;
