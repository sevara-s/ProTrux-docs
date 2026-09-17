import React from 'react';

interface OfflineBannerProps {
  isOffline: boolean;
  isSimulatedOffline: boolean;
  onRestore: () => void;
}

/**
 * Split-reality chalk line — local fork while the network is down.
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  isSimulatedOffline,
  onRestore,
}) => {
  if (!isOffline) return null;

  return (
    <div className="ptx-offline relative z-30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[#0e1014] border-b border-dashed border-[rgba(243,239,230,0.28)] animate-rise-in">
      <div className="flex items-center gap-3 min-w-0">
        <span className="ptx-signal text-accent shrink-0">Local fork</span>
        <span className="hidden sm:inline w-8 h-px bg-[rgba(243,239,230,0.35)]" />
        <p className="text-[11px] text-chrome-muted font-mono leading-snug truncate">
          {isSimulatedOffline ? 'Simulated partition' : 'Network lost'} — edits stay on this desk; merge on reconnect.
        </p>
      </div>
      <button
        type="button"
        onClick={
          isSimulatedOffline
            ? onRestore
            : () => {
                if (navigator.onLine) window.dispatchEvent(new Event('online'));
                else window.location.reload();
              }
        }
        className="px-3 py-1.5 rounded-md bg-accent text-accent-fg font-mono text-[10px] uppercase tracking-[0.14em] font-bold hover:brightness-110 transition-all shrink-0"
      >
        {isSimulatedOffline ? 'Merge branches' : 'Retry sync'}
      </button>
    </div>
  );
};
