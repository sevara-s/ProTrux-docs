import React, { useState, useEffect, useCallback } from 'react';
import { CRDTManager } from './services/crdt';
import { getDocuments, createDocument, updateDocument, deleteDocument, getDocument } from './services/api';
import { DocumentMetadata, UserPresence, SyncStatus, getRandomUser, DocumentTemplate } from '@protrux/shared';
import { DocsHeader } from './components/DocsHeader';
import { DocsDashboard } from './components/DocsDashboard';
import { Editor } from './components/Editor';
import { OfflineBanner } from './components/OfflineBanner';
import { ShareModal } from './components/ShareModal';

export const App: React.FC = () => {
  // Navigation: 'dashboard' | 'editor'
  const [view, setView] = useState<'dashboard' | 'editor'>(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    return params.get('doc') ? 'editor' : 'dashboard';
  });

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

  // Dialogs
  const [isWordCountOpen, setIsWordCountOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
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
      if (doc) {
        setCurrentDocId(doc);
        setView('editor');
      } else {
        setView('dashboard');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initialize or re-create CRDT manager whenever currentDocId changes in editor view
  useEffect(() => {
    if (view !== 'editor') return;

    window.location.hash = `doc=${encodeURIComponent(currentDocId)}`;

    if (crdtManager) {
      crdtManager.destroy();
    }

    const manager = new CRDTManager({
      docId: currentDocId,
      user: currentUser,
      onStatusChange: (status) => setSyncStatus(status),
      onAwarenessChange: (users) => {
        const others = users.filter((u) => u.name !== currentUser.name);
        setCollaborators(others);
      },
    });

    if (isSimulatedOffline) {
      manager.simulateOffline(true);
    }

    setCrdtManager(manager);

    getDocument(currentDocId)
      .then((doc) => {
        if (doc) setCurrentDocTitle(doc.title);
      })
      .catch(() => {});

    return () => {
      manager.destroy();
    };
  }, [currentDocId, view]);

  // Handle document title rename
  const handleTitleChange = async (newTitle: string) => {
    setCurrentDocTitle(newTitle);
    try {
      await updateDocument(currentDocId, { title: newTitle });
      refreshDocuments();
    } catch (err) {
      console.error('Failed to persist title to backend:', err);
    }
  };

  // Handle document creation from Template
  const handleCreateFromTemplate = async (template: DocumentTemplate) => {
    const newId = `doc-${Date.now()}`;
    const initialTitle = template.id === 'blank' ? 'Untitled document' : template.name;

    try {
      const created = await createDocument(initialTitle, newId);
      setDocuments((prev) => [created, ...prev]);
      setCurrentDocId(created.id);
      setCurrentDocTitle(created.title);
      setView('editor');

      // Inject template content once editor mounts
      setTimeout(() => {
        if (editorInstance && template.content) {
          editorInstance.commands.setContent(template.content);
        }
      }, 400);
    } catch (err) {
      console.error('Failed to create document:', err);
      setCurrentDocId(newId);
      setCurrentDocTitle(initialTitle);
      setView('editor');
    }
  };

  // Handle document creation (blank)
  const handleNewBlankDocument = () => {
    handleCreateFromTemplate({
      id: 'blank',
      name: 'Untitled document',
      category: 'General',
      description: 'Blank',
      thumbnailColor: '#ffffff',
      content: '<p></p>',
    });
  };

  // Handle document deletion
  const handleDeleteDocument = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Move document to trash?')) return;

    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (currentDocId === id) {
        setView('dashboard');
        window.location.hash = '';
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

  // If on Dashboard view (https://docs.google.com/document/u/0/)
  if (view === 'dashboard') {
    return (
      <DocsDashboard
        documents={documents}
        onSelectDocument={(id) => {
          setCurrentDocId(id);
          setView('editor');
          window.location.hash = `doc=${encodeURIComponent(id)}`;
        }}
        onCreateFromTemplate={handleCreateFromTemplate}
        onDeleteDocument={handleDeleteDocument}
        currentUser={currentUser}
      />
    );
  }

  // If on Document Editor view
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f9fbfd] flex-col font-sans select-none">
      {/* Google Docs Top Header & Menus */}
      <DocsHeader
        title={currentDocTitle}
        onTitleChange={handleTitleChange}
        syncStatus={syncStatus}
        collaborators={collaborators}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulateOffline={handleToggleSimulateOffline}
        onOpenWordCount={() => setIsWordCountOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onNavigateHome={() => {
          setView('dashboard');
          window.location.hash = '';
        }}
        onDeleteDocument={() => handleDeleteDocument(currentDocId)}
        onNewDocument={handleNewBlankDocument}
        editor={editorInstance}
      />

      {/* Offline Alert Banner */}
      <OfflineBanner
        isOffline={syncStatus === 'offline'}
        isSimulatedOffline={isSimulatedOffline}
        onRestore={handleToggleSimulateOffline}
      />

      {/* Google Docs Editor Canvas, Toolbar, and Ruler */}
      {crdtManager ? (
        <Editor
          key={currentDocId}
          crdt={crdtManager}
          onEditorReady={(editor) => setEditorInstance(editor)}
          isWordCountOpen={isWordCountOpen}
          onCloseWordCount={() => setIsWordCountOpen(false)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#5f6368] text-sm">
          Loading document...
        </div>
      )}

      {/* Google Docs Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        documentTitle={currentDocTitle}
        collaborators={collaborators}
        currentUser={currentUser}
      />
    </div>
  );
};

export default App;
