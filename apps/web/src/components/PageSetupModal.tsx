import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  PAGE_PRESETS,
  PageOrientation,
  PagePresetId,
  usePageStore,
} from '@/store/page-store';

interface PageSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PageSetupModal: React.FC<PageSetupModalProps> = ({ isOpen, onClose }) => {
  const store = usePageStore();
  const [presetId, setPresetId] = useState<PagePresetId>(store.presetId);
  const [orientation, setOrientation] = useState<PageOrientation>(store.orientation);
  const [widthIn, setWidthIn] = useState(String(store.widthIn));
  const [heightIn, setHeightIn] = useState(String(store.heightIn));
  const [marginLeftIn, setMarginLeftIn] = useState(String(store.marginLeftIn));
  const [marginRightIn, setMarginRightIn] = useState(String(store.marginRightIn));
  const [marginTopIn, setMarginTopIn] = useState(String(store.marginTopIn));
  const [marginBottomIn, setMarginBottomIn] = useState(String(store.marginBottomIn));

  useEffect(() => {
    if (!isOpen) return;
    setPresetId(store.presetId);
    setOrientation(store.orientation);
    setWidthIn(String(store.widthIn));
    setHeightIn(String(store.heightIn));
    setMarginLeftIn(String(store.marginLeftIn));
    setMarginRightIn(String(store.marginRightIn));
    setMarginTopIn(String(store.marginTopIn));
    setMarginBottomIn(String(store.marginBottomIn));
  }, [isOpen, store]);

  if (!isOpen) return null;

  const applyPreset = (id: PagePresetId) => {
    setPresetId(id);
    const preset = PAGE_PRESETS.find((p) => p.id === id);
    if (!preset || id === 'custom') return;
    let nextW = preset.widthIn;
    let nextH = preset.heightIn;
    if (orientation === 'landscape' && nextW < nextH) {
      [nextW, nextH] = [nextH, nextW];
    } else if (orientation === 'portrait' && nextW > nextH) {
      [nextW, nextH] = [nextH, nextW];
    }
    setWidthIn(String(nextW));
    setHeightIn(String(nextH));
  };

  const applyOrientation = (next: PageOrientation) => {
    setOrientation(next);
    const w = parseFloat(widthIn) || 8.5;
    const h = parseFloat(heightIn) || 11;
    if (next === 'landscape' && w < h) {
      setWidthIn(String(h));
      setHeightIn(String(w));
    } else if (next === 'portrait' && w > h) {
      setWidthIn(String(h));
      setHeightIn(String(w));
    }
  };

  const handleSave = () => {
    const w = Math.max(3, Math.min(22, parseFloat(widthIn) || 8.5));
    const h = Math.max(3, Math.min(22, parseFloat(heightIn) || 11));
    const ml = Math.max(0.25, parseFloat(marginLeftIn) || 1);
    const mr = Math.max(0.25, parseFloat(marginRightIn) || 1);
    const mt = Math.max(0.25, parseFloat(marginTopIn) || 1);
    const mb = Math.max(0.25, parseFloat(marginBottomIn) || 1);
    store.applySetup({
      presetId,
      orientation,
      widthIn: w,
      heightIn: h,
      marginLeftIn: ml,
      marginRightIn: mr,
      marginTopIn: mt,
      marginBottomIn: mb,
    });
    onClose();
  };

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: { disabled?: boolean }
  ) => (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-fg-soft">
      <span>{label}</span>
      <input
        type="number"
        min={0.25}
        max={22}
        step={0.05}
        value={value}
        disabled={opts?.disabled}
        onChange={(e) => {
          onChange(e.target.value);
          if (label.includes('Width') || label.includes('Height')) {
            setPresetId('custom');
          }
        }}
        className="px-3 py-2 rounded-lg border border-line bg-surface text-fg text-sm outline-none focus:border-accent disabled:opacity-50"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-[2px]">
      <div className="bg-elevated relative w-full max-w-md rounded-panel border border-line p-6 shadow-lift animate-fade-scale">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="ptx-mark text-xl text-fg">Page setup</h2>
            <p className="text-xs text-fg-muted mt-1">
              Width, height, and margins — like Google Docs.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-fg-muted hover:bg-muted hover:text-fg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-fg-soft">
            <span>Paper size</span>
            <select
              value={presetId}
              onChange={(e) => applyPreset(e.target.value as PagePresetId)}
              className="px-3 py-2 rounded-lg border border-line bg-surface text-fg text-sm outline-none focus:border-accent"
            >
              {PAGE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-xs font-semibold text-fg-soft mb-1.5">Orientation</p>
            <div className="flex gap-2">
              {(['portrait', 'landscape'] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => applyOrientation(o)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border capitalize transition-colors ${
                    orientation === o
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line bg-surface text-fg-soft hover:border-border-strong'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Width (inches)', widthIn, setWidthIn)}
            {field('Height (inches)', heightIn, setHeightIn)}
          </div>

          <div>
            <p className="text-xs font-semibold text-fg-soft mb-1.5">Margins (inches)</p>
            <div className="grid grid-cols-2 gap-3">
              {field('Top', marginTopIn, setMarginTopIn)}
              {field('Bottom', marginBottomIn, setMarginBottomIn)}
              {field('Left', marginLeftIn, setMarginLeftIn)}
              {field('Right', marginRightIn, setMarginRightIn)}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-line text-fg-soft hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-accent text-accent-fg hover:brightness-110 transition-all"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
