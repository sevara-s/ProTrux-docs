import { useEffect, useRef, useState } from 'react';
import { CRDTManager } from '@/services/crdt';
import { useUserStore } from '@/store/user-store';

export function useCRDT(docId: string) {
  const [manager, setManager] = useState<CRDTManager | null>(null);
  const currentUser = useUserStore((state) => state.currentUser);
  const isSimulatedOffline = useUserStore((state) => state.isSimulatedOffline);
  const setSyncStatus = useUserStore((state) => state.setSyncStatus);
  const setCollaborators = useUserStore((state) => state.setCollaborators);

  const managerRef = useRef<CRDTManager | null>(null);

  useEffect(() => {
    if (!docId) return;

    if (managerRef.current) {
      managerRef.current.destroy();
    }

    const crdt = new CRDTManager({
      docId,
      user: currentUser,
      onStatusChange: (status) => setSyncStatus(status),
      onAwarenessChange: (users) => {
        const others = users.filter((u) => u.name !== currentUser.name);
        setCollaborators(others);
      },
    });

    if (isSimulatedOffline) {
      crdt.simulateOffline(true);
    }

    managerRef.current = crdt;
    setManager(crdt);

    return () => {
      crdt.destroy();
      managerRef.current = null;
    };
  }, [docId]);

  // Sync simulated offline toggles
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.simulateOffline(isSimulatedOffline);
    }
  }, [isSimulatedOffline]);

  // Sync user profile updates
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateUser(currentUser.name, currentUser.color);
    }
  }, [currentUser]);

  return manager;
}
