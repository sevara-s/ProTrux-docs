import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { UserPresence, SyncStatus, getRandomUser } from '@protrux/shared';

export interface CRDTManagerOptions {
  docId: string;
  user?: { name: string; color: string };
  onStatusChange?: (status: SyncStatus) => void;
  onAwarenessChange?: (users: UserPresence[]) => void;
  onSynced?: (isSynced: boolean) => void;
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

  constructor(options: CRDTManagerOptions) {
    this.docId = options.docId;
    this.onStatusChange = options.onStatusChange;
    this.onAwarenessChange = options.onAwarenessChange;
    this.onSynced = options.onSynced;

    // Load or generate consistent user profile from localStorage
    const savedUser = localStorage.getItem('protrux_user_profile');
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch {
        this.user = options.user || getRandomUser();
      }
    } else {
      this.user = options.user || getRandomUser();
      localStorage.setItem('protrux_user_profile', JSON.stringify(this.user));
    }

    // Initialize in-memory Yjs CRDT Document
    this.ydoc = new Y.Doc();

    this.initPersistence();
    this.initWebSocket();
  }

  private initPersistence() {
    // 1. Initialize IndexedDB local offline persistence
    this.idbPersistence = new IndexeddbPersistence(this.docId, this.ydoc);

    this.idbPersistence.on('synced', () => {
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
    // Connect to WebSocket via Vite proxy or direct host
    const wsUrl = `${protocol}//${host}/ws`;

    this.provider = new WebsocketProvider(wsUrl, this.docId, this.ydoc, {
      connect: !this.isSimulatedOffline,
    });

    // Configure user awareness (presence & cursor metadata)
    this.provider.awareness.setLocalStateField('user', {
      name: this.user.name,
      color: this.user.color,
    });

    this.provider.on('status', (event: { status: string }) => {
      this.isConnected = event.status === 'connected';
      this.updateStatus();
    });

    this.provider.on('sync', (isSynced: boolean) => {
      this.isWsSynced = isSynced;
      this.updateStatus();
    });

    // Listen to remote collaborators awareness updates
    this.provider.awareness.on('change', () => {
      if (!this.provider) return;
      const states = this.provider.awareness.getStates();
      const collaborators: UserPresence[] = [];

      states.forEach((state: any, clientID: number) => {
        if (state.user) {
          collaborators.push({
            id: String(clientID),
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#6366f1',
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

  public simulateOffline(offline: boolean) {
    this.isSimulatedOffline = offline;

    if (!this.provider) {
      this.initWebSocket();
    }

    if (offline) {
      this.provider?.disconnect();
      this.isConnected = false;
      this.isWsSynced = false;
      this.updateStatus();
    } else {
      this.provider?.connect();
      this.updateStatus();
    }
  }

  public getIsOffline(): boolean {
    return this.isSimulatedOffline || !navigator.onLine || !this.isConnected;
  }

  private updateStatus() {
    let status: SyncStatus = 'connecting';

    if (this.isSimulatedOffline || !navigator.onLine) {
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
    localStorage.setItem('protrux_user_profile', JSON.stringify(this.user));
    if (this.provider) {
      this.provider.awareness.setLocalStateField('user', { name, color });
    }
  }

  public destroy() {
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
