import React from 'react';
import { useUserStore } from '@/store/user-store';

/**
 * Helix presence rail — collaborator color spectrum + folio width cue.
 * Editorial measure strip tied to live awareness, not a print ruler.
 */
const FOREST_TONES = ['#1f6f5c', '#164f42', '#3d8f7a', '#5aab94', '#2d8570', '#4a9e88'];

function toneFor(color: string, index: number) {
  // Keep brand-aligned forest tones even if an old rainbow profile is in localStorage
  const hex = (color || '').toLowerCase();
  if (/^#1f6f5c|^#164f42|^#3d8f7a|^#5aab94|^#13201c|^#2d8570|^#4a9e88/.test(hex)) {
    return color;
  }
  return FOREST_TONES[index % FOREST_TONES.length];
}

export const FolioRail: React.FC = () => {
  const collaborators = useUserStore((s) => s.collaborators);
  const currentUser = useUserStore((s) => s.currentUser);
  const syncStatus = useUserStore((s) => s.syncStatus);

  const colors = [
    toneFor(currentUser.color, 0),
    ...collaborators.map((c, i) => toneFor(c.color, i + 1)),
  ].slice(0, 8);

  const statusLabel =
    syncStatus === 'offline'
      ? 'Offline'
      : syncStatus === 'synced'
        ? 'Connected'
        : syncStatus === 'syncing'
          ? 'Syncing'
          : 'Connecting';

  return (
    <div className="w-full flex justify-center select-none py-2 px-4">
      <div className="w-full max-w-[42rem] flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-fg-muted">
            {statusLabel}
          </span>
          <span className="text-[10px] font-mono text-fg-muted tabular-nums">
            {1 + collaborators.length} author{collaborators.length === 0 ? '' : 's'}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-elevated/80 border border-line flex shadow-soft">
          {colors.map((color, i) => (
            <div
              key={`${color}-${i}`}
              className="h-full flex-1 first:rounded-l-full last:rounded-r-full transition-all duration-500"
              style={{ backgroundColor: color, opacity: 0.85 + (i === 0 ? 0.15 : 0) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/** @deprecated Use FolioRail — kept as alias during rename. */
export const DocsRuler = FolioRail;
