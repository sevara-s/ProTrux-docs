import React, { useState, useEffect, useRef } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { useCRDT } from '@/hooks/useCRDT';
import { useDocumentStore } from '@/store/document-store';
import { useUserStore } from '@/store/user-store';
import { DocsHeader } from '@/components/DocsHeader';
import { DocsDashboard } from '@/components/DocsDashboard';
import { Editor } from '@/components/Editor';
import { OfflineBanner } from '@/components/OfflineBanner';
import { OpenFileModal } from '@/components/OpenFileModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocumentTemplate } from '@protrux/shared';

function readDocFromHash(): string | null {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  return params.get('doc');
}

export const App: React.FC = () => {
  const { documents, create, remove, rename, refetch } = useDocuments();

  const view = useDocumentStore((state) => state.view);
  const setView = useDocumentStore((state) => state.setView);
  const currentDocId = useDocumentStore((state) => state.currentDocId);
  const setCurrentDocId = useDocumentStore((state) => state.setCurrentDocId);
  const setCurrentDocTitle = useDocumentStore((state) => state.setCurrentDocTitle);
  const setPendingContent = useDocumentStore((state) => state.setPendingContent);

  const currentUser = useUserStore((state) => state.currentUser);
  const isSimulatedOffline = useUserStore((state) => state.isSimulatedOffline);
  const syncStatus = useUserStore((state) => state.syncStatus);
  const toggleSimulatedOffline = useUserStore((state) => state.toggleSimulatedOffline);

  const [editorInstance, setEditorInstance] = useState<any>(null);
  const didInitHash = useRef(false);

  const crdtManager = useCRDT(view === 'editor' ? currentDocId : '');

  // Refresh document list whenever we land on the dashboard
  useEffect(() => {
    if (view === 'dashboard') {
      void refetch();
    }
  }, [view, refetch]);

  // Apply deep-link on first load + listen for hash changes
  useEffect(() => {
    const applyHash = () => {
      const doc = readDocFromHash();
      if (doc) {
        setCurrentDocId(doc);
        const meta = useDocumentStore.getState().documents.find((d) => d.id === doc);
        if (meta) setCurrentDocTitle(meta.title);
        setView('editor');
      } else if (didInitHash.current) {
        setView('dashboard');
      }
    };

    applyHash();
    didInitHash.current = true;

    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [setCurrentDocId, setCurrentDocTitle, setView]);

  // Keep title in sync when documents list loads for a deep-linked doc
  useEffect(() => {
    if (view !== 'editor') return;
    const meta = documents.find((d) => d.id === currentDocId);
    if (meta) setCurrentDocTitle(meta.title);
  }, [documents, currentDocId, view, setCurrentDocTitle]);

  const handleCreateFromTemplate = async (template: DocumentTemplate) => {
    const newId = `doc-${Date.now()}`;
    const initialTitle = template.id === 'blank' ? 'Untitled document' : template.name;

    // create() queues local metadata when REST is unreachable — dashboard stays consistent offline
    const created = await create(initialTitle, newId);
    if (template.content && template.id !== 'blank') {
      setPendingContent(template.content);
    } else {
      setPendingContent(null);
    }
    setCurrentDocId(created.id);
    setCurrentDocTitle(created.title);
    setView('editor');
    window.location.hash = `doc=${encodeURIComponent(created.id)}`;
  };

  const handleSelectDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      setCurrentDocTitle(doc.title);
    }
    setPendingContent(null);
    setCurrentDocId(id);
    setView('editor');
    window.location.hash = `doc=${encodeURIComponent(id)}`;
  };

  const handleDeleteDocument = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Move this document to trash?')) return;

    await remove(id);
    if (currentDocId === id) {
      setView('dashboard');
      window.location.hash = '';
    }
  };

  const handleImportContent = async (title: string, content: string) => {
    const newId = `doc-${Date.now()}`;
    const created = await create(title, newId);
    setPendingContent(content || null);
    setCurrentDocId(created.id);
    setCurrentDocTitle(created.title);
    setView('editor');
    window.location.hash = `doc=${encodeURIComponent(created.id)}`;
  };

  const handleRename = async (id: string, title: string) => {
    await rename(id, title);
  };

  if (view === 'dashboard') {
    return (
      <ErrorBoundary fallbackTitle="Home error">
        <DocsDashboard
          documents={documents}
          onSelectDocument={handleSelectDocument}
          onCreateFromTemplate={handleCreateFromTemplate}
          onDeleteDocument={handleDeleteDocument}
          currentUser={currentUser}
        />
        <OpenFileModal
          onOpenDocument={handleSelectDocument}
          onImportContent={handleImportContent}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Editor error">
      <div className="flex h-screen w-screen overflow-hidden ptx-desk flex-col font-sans select-none">
        <DocsHeader
          editor={editorInstance}
          onNavigateHome={() => {
            setView('dashboard');
            window.location.hash = '';
          }}
          onDeleteDocument={() => handleDeleteDocument(currentDocId)}
          onNewDocument={() =>
            handleCreateFromTemplate({
              id: 'blank',
              name: 'Untitled document',
              category: 'General',
              description: 'Blank',
              thumbnailColor: '#ffffff',
              content: '<p></p>',
            })
          }
          onRenameDocument={handleRename}
        />

        <OfflineBanner
          isOffline={syncStatus === 'offline'}
          isSimulatedOffline={isSimulatedOffline}
          onRestore={toggleSimulatedOffline}
        />

        {crdtManager ? (
          <Editor
            key={`${currentDocId}-${crdtManager.ydoc.clientID}`}
            crdt={crdtManager}
            onEditorReady={(editor) => setEditorInstance(editor)}
          />
        ) : (
        <div className="flex-1 flex items-center justify-center text-fg-muted text-sm font-medium">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-elevated border border-line shadow-soft">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" />
            Loading document…
          </div>
        </div>
        )}

        <OpenFileModal
          onOpenDocument={handleSelectDocument}
          onImportContent={handleImportContent}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
