import { create } from 'zustand';
import { UserPresence, SyncStatus, getRandomUser } from '@protrux/shared';
import {
  readSimulatedOfflineFlag,
  writeSimulatedOfflineFlag,
} from '@/services/crdt';

const USER_KEY = 'protrux_user_profile';
const IDENTITY_SET_KEY = 'protrux_identity_set';

interface UserState {
  currentUser: { name: string; color: string };
  hasChosenIdentity: boolean;
  isSimulatedOffline: boolean;
  syncStatus: SyncStatus;
  collaborators: UserPresence[];
  setCurrentUser: (user: { name: string; color: string }) => void;
  markIdentityChosen: () => void;
  requestIdentityEdit: () => void;
  setSimulatedOffline: (offline: boolean) => void;
  toggleSimulatedOffline: () => void;
  setSyncStatus: (status: SyncStatus) => void;
  setCollaborators: (peers: UserPresence[]) => void;
}

function readIdentityChosen(): boolean {
  try {
    return sessionStorage.getItem(IDENTITY_SET_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Per-tab identity (sessionStorage) so two tabs in the same browser
 * get different names by default — required for a clear multi-user demo.
 */
const getStoredUser = () => {
  try {
    const saved = sessionStorage.getItem(USER_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  const fresh = getRandomUser();
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(fresh));
  } catch {
    // ignore
  }
  return fresh;
};

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: getStoredUser(),
  hasChosenIdentity: readIdentityChosen(),
  isSimulatedOffline: readSimulatedOfflineFlag(),
  syncStatus: 'connecting',
  collaborators: [],

  setCurrentUser: (currentUser) => {
    try {
      sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } catch {
      // ignore
    }
    set({ currentUser });
  },

  markIdentityChosen: () => {
    try {
      sessionStorage.setItem(IDENTITY_SET_KEY, '1');
    } catch {
      // ignore
    }
    set({ hasChosenIdentity: true });
  },

  requestIdentityEdit: () => {
    try {
      sessionStorage.removeItem(IDENTITY_SET_KEY);
    } catch {
      // ignore
    }
    set({ hasChosenIdentity: false });
  },

  setSimulatedOffline: (isSimulatedOffline) => {
    writeSimulatedOfflineFlag(isSimulatedOffline);
    set({ isSimulatedOffline });
  },

  toggleSimulatedOffline: () => {
    const next = !get().isSimulatedOffline;
    writeSimulatedOfflineFlag(next);
    set({ isSimulatedOffline: next });
  },

  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setCollaborators: (collaborators) => set({ collaborators }),
}));
