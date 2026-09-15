import React from 'react';
import { WifiOff, RefreshCw, ShieldCheck } from 'lucide-react';

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
    <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm border-b border-amber-600 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-amber-600 text-white">
          <WifiOff className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold">
            {isSimulatedOffline ? 'Simulated Offline Mode Active' : 'Network Disconnected'}:
          </span>
          <span>
            Edits are saved locally via <strong>IndexedDB CRDT deltas</strong>. Changes will automatically merge upon reconnecting.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="hidden md:flex items-center gap-1 text-[11px] text-amber-950 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero Data Loss Guaranteed</span>
        </span>
        <button
          type="button"
          onClick={onRestore}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-950 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Restore Connection</span>
        </button>
      </div>
    </div>
  );
};
