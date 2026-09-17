import React from 'react';
import { WifiOff, RefreshCw, Shield } from 'lucide-react';

interface OfflineBannerProps {
  isOffline: boolean;
  isSimulatedOffline: boolean;
  onRestore: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  isSimulatedOffline,
  onRestore,
}) => {
  if (!isOffline) return null;

  return (
    <div className="ptx-offline bg-ink text-chrome-fg px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-white/10 animate-rise-in">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-md bg-accent text-accent-fg">
          <WifiOff className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold uppercase tracking-wide font-mono text-[11px] text-accent">
            {isSimulatedOffline ? 'Simulated partition' : 'Network lost'}
          </span>
          <span className="text-chrome-muted">
            — edits persist in IndexedDB and merge on reconnect.
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <span className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-chrome-muted">
          <Shield className="w-3.5 h-3.5" />
          Zero-loss merge
        </span>
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-fg font-bold text-xs hover:brightness-110 transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          {isSimulatedOffline ? 'Restore link' : 'Retry sync'}
        </button>
      </div>
    </div>
  );
};
