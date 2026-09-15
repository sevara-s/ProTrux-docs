import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CRDTManager } from './services/crdt';
import { getDocuments, createDocument, updateDocument, deleteDocument, getDocument } from './services/api';
import { DocumentMetadata, UserPresence, SyncStatus, getRandomUser } from '@protrux/shared';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OfflineBanner } from './components/OfflineBanner';
import { Editor } from './components/Editor';

export const App: React.FC = () => {
  // Document state
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string>(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    return params.get('doc') || 'welcome-doc';
  });
  const [currentDocTitle, setCurrentDocTitle] = useState<string>('Welcome to ProTrux Collaborative Docs');

  // CRDT & Sync state
  const [crdtManager, setCrdtManager] = useState<CRDTManager | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [collaborators, setCollaborators] = useState<UserPresence[]>([]);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // Current user profile
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('protrux_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getRandomUser();
      }
    }
    const fresh = getRandomUser();
    localStorage.setItem('protrux_user_profile', JSON.stringify(fresh));
    return fresh;
  });

  // Load document list
  const refreshDocuments = useCallback(async () => {
    try {
      const list = await getDocuments();
      setDocuments(list);
      const active = list.find((d) => d.id === currentDocId);
      if (active) {
        setCurrentDocTitle(active.title);
      }
    } catch (err) {
      console.warn('Could not fetch documents list (might be offline):', err);
    }
  }, [currentDocId]);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      const doc = params.get('doc');
      if (doc && doc !== currentDocId) {
        setCurrentDocId(doc);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentDocId]);

  // Initialize or re-create CRDT manager whenever currentDocId changes
  useEffect(() => {
    // Sync URL hash
    window.location.hash = `doc=${encodeURIComponent(currentDocId)}`;

    // Destroy previous CRDT session
    if (crdtManager) {
      crdtManager.destroy();
    }

    const manager = new CRDTManager({
      docId: currentDocId,
      user: currentUser,
      onStatusChange: (status) => setSyncStatus(status),
      onAwarenessChange: (users) => {
        // Filter out self from remote collaborator list
        const others = users.filter((u) => u.name !== currentUser.name);
        setCollaborators(others);
      },
    });

    if (isSimulatedOffline) {
      manager.simulateOffline(true);
    }

    setCrdtManager(manager);

    // Fetch fresh title
    getDocument(currentDocId)
      .then((doc) => {
        if (doc) setCurrentDocTitle(doc.title);
      })
      .catch(() => {
        // If offline, preserve title
      });

    return () => {
      manager.destroy();
    };
  }, [currentDocId]);

  // Handle document title rename
  const handleTitleChange = async (newTitle: string) => {
    setCurrentDocTitle(newTitle);
    try {
      await updateDocument(currentDocId, { title: newTitle });
      refreshDocuments();
    } catch (err) {
      console.error('Failed to persist renamed title to backend:', err);
    }
  };

  // Handle new document creation
  const handleCreateDocument = async () => {
    const defaultTitle = `Document ${documents.length + 1}`;
    const newId = `doc-${Date.now()}`;
    try {
      const created = await createDocument(defaultTitle, newId);
      setDocuments((prev) => [created, ...prev]);
      setCurrentDocId(created.id);
      setCurrentDocTitle(created.title);
      setIsSidebarOpen(false);
    } catch (err) {
      console.error('Failed to create new document:', err);
      // Fallback local switch
      setCurrentDocId(newId);
      setCurrentDocTitle(defaultTitle);
      setIsSidebarOpen(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (currentDocId === id) {
        const remaining = documents.filter((d) => d.id !== id);
        const nextId = remaining[0]?.id || 'welcome-doc';
        setCurrentDocId(nextId);
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  // Toggle simulated offline mode
  const handleToggleSimulateOffline = () => {
    const nextState = !isSimulatedOffline;
    setIsSimulatedOffline(nextState);
    if (crdtManager) {
      crdtManager.simulateOffline(nextState);
    }
  };

  // Update user profile
  const handleUpdateUser = (name: string, color: string) => {
    const updated = { name, color };
    setCurrentUser(updated);
    if (crdtManager) {
      crdtManager.updateUser(name, color);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper-100 flex-col font-sans">
      {/* Workspace Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        documents={documents}
        currentDocId={currentDocId}
        onSelectDoc={(id) => {
          setCurrentDocId(id);
          setIsSidebarOpen(false);
        }}
        onCreateDoc={handleCreateDocument}
        onDeleteDoc={handleDeleteDocument}
      />

      {/* Top Navigation Bar */}
      <Navbar
        title={currentDocTitle}
        onTitleChange={handleTitleChange}
        syncStatus={syncStatus}
        collaborators={collaborators}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulateOffline={handleToggleSimulateOffline}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        editor={editorInstance}
      />

      {/* Offline Alert Banner */}
      <OfflineBanner
        isOffline={syncStatus === 'offline'}
        isSimulatedOffline={isSimulatedOffline}
        onRestore={handleToggleSimulateOffline}
      />

      {/* Main Document Canvas & Tiptap CRDT Editor */}
      {crdtManager ? (
        <Editor
          key={currentDocId}
          crdt={crdtManager}
          onEditorReady={(editor) => setEditorInstance(editor)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
          Loading document CRDT state...
        </div>
      )}
    </div>
  );
};

export default App;
