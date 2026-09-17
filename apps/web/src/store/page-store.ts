import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** CSS px at 96dpi (browser inches). */
export const INCH = 96;

export type PagePresetId = 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3' | 'custom';

export interface PagePreset {
  id: PagePresetId;
  label: string;
  widthIn: number;
  heightIn: number;
}

export const PAGE_PRESETS: PagePreset[] = [
  { id: 'letter', label: 'Letter (8.5 × 11")', widthIn: 8.5, heightIn: 11 },
  { id: 'legal', label: 'Legal (8.5 × 14")', widthIn: 8.5, heightIn: 14 },
  { id: 'tabloid', label: 'Tabloid (11 × 17")', widthIn: 11, heightIn: 17 },
  { id: 'a4', label: 'A4 (210 × 297 mm)', widthIn: 8.27, heightIn: 11.69 },
  { id: 'a3', label: 'A3 (297 × 420 mm)', widthIn: 11.69, heightIn: 16.54 },
  { id: 'custom', label: 'Custom', widthIn: 8.5, heightIn: 11 },
];

export type PageOrientation = 'portrait' | 'landscape';

interface PageState {
  presetId: PagePresetId;
  orientation: PageOrientation;
  widthIn: number;
  heightIn: number;
  marginLeftIn: number;
  marginRightIn: number;
  marginTopIn: number;
  marginBottomIn: number;
  setPreset: (id: PagePresetId) => void;
  setOrientation: (orientation: PageOrientation) => void;
  setCustomSize: (widthIn: number, heightIn: number) => void;
  setMargins: (margins: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  }) => void;
  applySetup: (setup: {
    presetId: PagePresetId;
    orientation: PageOrientation;
    widthIn: number;
    heightIn: number;
    marginLeftIn: number;
    marginRightIn: number;
    marginTopIn: number;
    marginBottomIn: number;
  }) => void;
}

function clampMargin(value: number, pageSide: number, opposite: number) {
  const min = 0.25;
  const max = Math.max(min, pageSide - opposite - 1);
  return Math.min(max, Math.max(min, Math.round(value * 100) / 100));
}

function orientedSize(
  widthIn: number,
  heightIn: number,
  orientation: PageOrientation
) {
  if (orientation === 'landscape' && widthIn < heightIn) {
    return { widthIn: heightIn, heightIn: widthIn };
  }
  if (orientation === 'portrait' && widthIn > heightIn) {
    return { widthIn: heightIn, heightIn: widthIn };
  }
  return { widthIn, heightIn };
}

export const usePageStore = create<PageState>()(
  persist(
    (set, get) => ({
      presetId: 'letter',
      orientation: 'portrait',
      widthIn: 8.5,
      heightIn: 11,
      marginLeftIn: 1,
      marginRightIn: 1,
      marginTopIn: 1,
      marginBottomIn: 1,

      setPreset: (id) => {
        const preset = PAGE_PRESETS.find((p) => p.id === id);
        if (!preset) return;
        const { orientation } = get();
        if (id === 'custom') {
          set({ presetId: 'custom' });
          return;
        }
        const size = orientedSize(preset.widthIn, preset.heightIn, orientation);
        set({
          presetId: id,
          widthIn: size.widthIn,
          heightIn: size.heightIn,
        });
      },

      setOrientation: (orientation) => {
        const { widthIn, heightIn, presetId } = get();
        const base =
          presetId === 'custom'
            ? { widthIn, heightIn }
            : PAGE_PRESETS.find((p) => p.id === presetId) ?? {
                widthIn,
                heightIn,
              };
        const size = orientedSize(base.widthIn, base.heightIn, orientation);
        set({
          orientation,
          widthIn: size.widthIn,
          heightIn: size.heightIn,
        });
      },

      setCustomSize: (widthIn, heightIn) => {
        set({
          presetId: 'custom',
          widthIn: Math.max(3, Math.min(22, widthIn)),
          heightIn: Math.max(3, Math.min(22, heightIn)),
        });
      },

      setMargins: ({ left, right, top, bottom }) => {
        const state = get();
        const nextLeft =
          left !== undefined
            ? clampMargin(left, state.widthIn, state.marginRightIn)
            : state.marginLeftIn;
        const nextRight =
          right !== undefined
            ? clampMargin(right, state.widthIn, nextLeft)
            : state.marginRightIn;
        const nextTop =
          top !== undefined
            ? clampMargin(top, state.heightIn, state.marginBottomIn)
            : state.marginTopIn;
        const nextBottom =
          bottom !== undefined
            ? clampMargin(bottom, state.heightIn, nextTop)
            : state.marginBottomIn;
        set({
          marginLeftIn: nextLeft,
          marginRightIn: nextRight,
          marginTopIn: nextTop,
          marginBottomIn: nextBottom,
        });
      },

      applySetup: (setup) => set(setup),
    }),
    { name: 'protrux-page-setup' }
  )
);

export function inchesToPx(inches: number) {
  return Math.round(inches * INCH);
}
