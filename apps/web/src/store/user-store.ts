import { create } from 'zustand';
import { UserPresence, SyncStatus, getRandomUser } from '@protrux/shared';

interface UserState {
  currentUser: { name: string; color: string };
  isSimulatedOffline: boolean;
  syncStatus: SyncStatus;
  collaborators: UserPresence[];
  setCurrentUser: (user: { name: string; color: string }) => void;
  setSimulatedOffline: (offline: boolean) => void;
  toggleSimulatedOffline: () => void;
  setSyncStatus: (status: SyncStatus) => void;
  setCollaborators: (peers: UserPresence[]) => void;
}

const getStoredUser = () => {
  try {
    const saved = localStorage.getItem('protrux_user_profile');
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  const fresh = getRandomUser();
  localStorage.setItem('protrux_user_profile', JSON.stringify(fresh));
  return fresh;
};

export const useUserStore = create<UserState>((set) => ({
  currentUser: getStoredUser(),
  isSimulatedOffline: false,
  syncStatus: 'connecting',
  collaborators: [],

  setCurrentUser: (currentUser) => {
    localStorage.setItem('protrux_user_profile', JSON.stringify(currentUser));
    set({ currentUser });
  },

  setSimulatedOffline: (isSimulatedOffline) => set({ isSimulatedOffline }),
  toggleSimulatedOffline: () =>
    set((state) => ({ isSimulatedOffline: !state.isSimulatedOffline })),

  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setCollaborators: (collaborators) => set({ collaborators }),
}));
