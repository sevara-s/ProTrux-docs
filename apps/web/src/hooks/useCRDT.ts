import { useEffect, useRef, useState } from 'react';
import { CRDTManager } from '@/services/crdt';
import { getOwnerKey } from '@/services/owner-key';
import { useDocumentStore } from '@/store/document-store';
import { useUserStore } from '@/store/user-store';

export function useCRDT(docId: string) {
  const [manager, setManager] = useState<CRDTManager | null>(null);
  const currentUser = useUserStore((state) => state.currentUser);
  const isSimulatedOffline = useUserStore((state) => state.isSimulatedOffline);
  const setSyncStatus = useUserStore((state) => state.setSyncStatus);
  const setCollaborators = useUserStore((state) => state.setCollaborators);
  const shareToken = useDocumentStore((state) => state.shareToken);

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
      ownerKey: getOwnerKey(),
      // Prefer hash `k` (guest share link); fall back to store (owner).
      shareToken: readShareTokenFromHash() || shareToken,
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
    // Only rebind when the room changes — remounting on shareToken churn
    // drops live peers mid-collab.
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

function readShareTokenFromHash(): string | null {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return null;
    return new URLSearchParams(hash).get('k');
  } catch {
    return null;
  }
}
