import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence, clearDocument } from 'y-indexeddb';
import { UserPresence, SyncStatus, getRandomUser } from '@protrux/shared';

export const SIMULATE_OFFLINE_KEY = 'protrux_simulate_offline';

export function readSimulatedOfflineFlag(): boolean {
  try {
    return sessionStorage.getItem(SIMULATE_OFFLINE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeSimulatedOfflineFlag(offline: boolean) {
  try {
    if (offline) sessionStorage.setItem(SIMULATE_OFFLINE_KEY, '1');
    else sessionStorage.removeItem(SIMULATE_OFFLINE_KEY);
  } catch {
    // private mode / blocked storage — in-memory still works for the session
  }
}

export interface CRDTManagerOptions {
  docId: string;
  user?: { name: string; color: string };
  onStatusChange?: (status: SyncStatus) => void;
  onAwarenessChange?: (users: UserPresence[]) => void;
  onSynced?: (isSynced: boolean) => void;
  /** Restore simulate-offline across reloads (sessionStorage). */
  startSimulatedOffline?: boolean;
}

export class CRDTManager {
  public ydoc: Y.Doc;
  public provider: WebsocketProvider | null = null;
  public idbPersistence: IndexeddbPersistence | null = null;
  public docId: string;
  public user: { name: string; color: string };

  private isSimulatedOffline = false;
  private onStatusChange?: (status: SyncStatus) => void;
  private onAwarenessChange?: (users: UserPresence[]) => void;
  private onSynced?: (isSynced: boolean) => void;
  private isConnected = false;
  private isWsSynced = false;
  private isIdbSynced = false;
  private destroyed = false;
  private everConnected = false;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private forceOfflineUi = false;

  private handleOnline = () => {
    if (this.destroyed) return;
    if (!this.isSimulatedOffline && this.provider) {
      this.provider.connect();
    }
    this.updateStatus();
  };

  private handleOffline = () => {
    if (this.destroyed) return;
    this.isConnected = false;
    this.isWsSynced = false;
    this.updateStatus();
  };

  constructor(options: CRDTManagerOptions) {
    this.docId = options.docId;
    this.onStatusChange = options.onStatusChange;
    this.onAwarenessChange = options.onAwarenessChange;
    this.onSynced = options.onSynced;
    this.isSimulatedOffline =
      options.startSimulatedOffline ?? readSimulatedOfflineFlag();

    const savedUser = sessionStorage.getItem('protrux_user_profile');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch {
        this.user = options.user || getRandomUser();
      }
    } else {
      this.user = options.user || getRandomUser();
      try {
        sessionStorage.setItem('protrux_user_profile', JSON.stringify(this.user));
      } catch {
        // ignore
      }
    }

    this.ydoc = new Y.Doc();

    this.initPersistence();
    this.initWebSocket();

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private initPersistence() {
    this.idbPersistence = new IndexeddbPersistence(this.docId, this.ydoc);

    this.idbPersistence.on('synced', () => {
      if (this.destroyed) return;
      this.isIdbSynced = true;
      this.updateStatus();
      if (this.onSynced) {
        this.onSynced(true);
      }
    });
  }

  private initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    this.provider = new WebsocketProvider(wsUrl, this.docId, this.ydoc, {
      connect: !this.isSimulatedOffline && navigator.onLine,
    });

    this.provider.awareness.setLocalStateField('user', {
      name: this.user.name,
      color: this.user.color,
    });

    this.provider.on('status', (event: { status: string }) => {
      if (this.destroyed) return;
      this.isConnected = event.status === 'connected';
      if (this.isConnected) {
        this.everConnected = true;
        this.forceOfflineUi = false;
        this.clearDisconnectTimer();
      } else if (!this.isSimulatedOffline && navigator.onLine) {
        // Prolonged WS drop (server down / partition) → offline UX, not endless "Linking"
        this.scheduleDisconnectOffline();
      }
      this.updateStatus();
    });

    this.provider.on('sync', (isSynced: boolean) => {
      if (this.destroyed) return;
      this.isWsSynced = isSynced;
      this.updateStatus();
    });

    this.provider.awareness.on('change', () => {
      if (!this.provider || this.destroyed) return;
      const states = this.provider.awareness.getStates();
      const localId = this.provider.awareness.clientID;
      const collaborators: UserPresence[] = [];

      states.forEach((state: any, clientID: number) => {
        if (clientID === localId) return;
        if (state.user) {
          collaborators.push({
            id: String(clientID),
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#1f6f5c',
            cursor: state.cursor || null,
            lastActive: Date.now(),
          });
        }
      });

      if (this.onAwarenessChange) {
        this.onAwarenessChange(collaborators);
      }
    });
  }

  private scheduleDisconnectOffline() {
    if (this.disconnectTimer) return;
    this.disconnectTimer = setTimeout(() => {
      this.disconnectTimer = null;
      if (this.destroyed || this.isConnected || this.isSimulatedOffline) return;
      this.forceOfflineUi = true;
      this.isWsSynced = false;
      this.updateStatus();
    }, this.everConnected ? 1500 : 2500);
  }

  private clearDisconnectTimer() {
    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
  }

  /** True once IndexedDB has loaded local history (safe to seed empty docs). */
  public get isLocalReady(): boolean {
    return this.isIdbSynced;
  }

  public simulateOffline(offline: boolean) {
    this.isSimulatedOffline = offline;
    writeSimulatedOfflineFlag(offline);

    if (!this.provider) {
      this.initWebSocket();
    }

    if (offline) {
      this.clearDisconnectTimer();
      this.forceOfflineUi = false;
      this.provider?.disconnect();
      this.isConnected = false;
      this.isWsSynced = false;
      this.updateStatus();
    } else if (navigator.onLine) {
      this.forceOfflineUi = false;
      this.provider?.connect();
      this.updateStatus();
    } else {
      this.updateStatus();
    }
  }

  public getIsOffline(): boolean {
    return (
      this.isSimulatedOffline ||
      !navigator.onLine ||
      this.forceOfflineUi ||
      !this.isConnected
    );
  }

  private updateStatus() {
    if (this.destroyed) return;

    let status: SyncStatus = 'connecting';

    if (this.isSimulatedOffline || !navigator.onLine || this.forceOfflineUi) {
      status = 'offline';
    } else if (this.isConnected && this.isWsSynced) {
      status = 'synced';
    } else if (this.isConnected && !this.isWsSynced) {
      status = 'syncing';
    } else {
      status = 'connecting';
    }

    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  public updateUser(name: string, color: string) {
    this.user = { name, color };
    try {
      sessionStorage.setItem('protrux_user_profile', JSON.stringify(this.user));
    } catch {
      // ignore
    }
    if (this.provider) {
      this.provider.awareness.setLocalStateField('user', { name, color });
    }
  }

  public destroy() {
    this.destroyed = true;
    this.clearDisconnectTimer();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    if (this.idbPersistence) {
      this.idbPersistence.destroy();
      this.idbPersistence = null;
    }
    this.ydoc.destroy();
  }
}

/** Wipe client-side CRDT cache for a deleted document so it cannot resurrect. */
export async function clearDocumentIndexedDB(docId: string): Promise<void> {
  try {
    await clearDocument(docId);
  } catch {
    // ignore — best-effort local cleanup
  }
}
