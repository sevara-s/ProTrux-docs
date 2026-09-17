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
    if (!docId) {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
      setManager(null);
      setCollaborators([]);
      setSyncStatus('connecting');
      return;
    }

    if (managerRef.current) {
      managerRef.current.destroy();
      managerRef.current = null;
    }

    const crdt = new CRDTManager({
      docId,
      user: currentUser,
      startSimulatedOffline: isSimulatedOffline,
      onStatusChange: (status) => setSyncStatus(status),
      onAwarenessChange: (users) => {
        setCollaborators(users);
      },
    });

    managerRef.current = crdt;
    setManager(crdt);

    return () => {
      crdt.destroy();
      if (managerRef.current === crdt) {
        managerRef.current = null;
      }
    };
    // Intentionally only re-bind when the document room changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.simulateOffline(isSimulatedOffline);
    }
  }, [isSimulatedOffline]);

  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.updateUser(currentUser.name, currentUser.color);
    }
  }, [currentUser]);

  return manager;
}
