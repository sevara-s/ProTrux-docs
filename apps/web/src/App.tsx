import React, { useState, useEffect } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { useCRDT } from '@/hooks/useCRDT';
import { useDocumentStore } from '@/store/document-store';
import { useUserStore } from '@/store/user-store';
import { DocsHeader } from '@/components/DocsHeader';
import { DocsDashboard } from '@/components/DocsDashboard';
import { Editor } from '@/components/Editor';
import { OfflineBanner } from '@/components/OfflineBanner';
import { OpenFileModal } from '@/components/OpenFileModal';
import { DocumentTemplate } from '@protrux/shared';

export const App: React.FC = () => {
  const { documents, create, remove } = useDocuments();

  const view = useDocumentStore((state) => state.view);
  const setView = useDocumentStore((state) => state.setView);
  const currentDocId = useDocumentStore((state) => state.currentDocId);
  const setCurrentDocId = useDocumentStore((state) => state.setCurrentDocId);
  const setCurrentDocTitle = useDocumentStore((state) => state.setCurrentDocTitle);

  const currentUser = useUserStore((state) => state.currentUser);
  const isSimulatedOffline = useUserStore((state) => state.isSimulatedOffline);
  const syncStatus = useUserStore((state) => state.syncStatus);
  const toggleSimulatedOffline = useUserStore((state) => state.toggleSimulatedOffline);

  const [editorInstance, setEditorInstance] = useState<any>(null);

  // Bind CRDT manager hook for the active document
  const crdtManager = useCRDT(view === 'editor' ? currentDocId : '');

  // URL Hash Synchronizer
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
  }, [setCurrentDocId, setView]);

  // Handle template selection
  const handleCreateFromTemplate = async (template: DocumentTemplate) => {
    const newId = `doc-${Date.now()}`;
    const initialTitle = template.id === 'blank' ? 'Untitled document' : template.name;

    try {
      const created = await create(initialTitle, newId);
      setCurrentDocId(created.id);
      setCurrentDocTitle(created.title);
      setView('editor');
      window.location.hash = `doc=${encodeURIComponent(created.id)}`;

      // Inject template content after initial mount
      setTimeout(() => {
        if (editorInstance && template.content) {
          editorInstance.commands.setContent(template.content);
        }
      }, 350);
    } catch (err) {
      console.error('Error creating template document:', err);
      setCurrentDocId(newId);
      setCurrentDocTitle(initialTitle);
      setView('editor');
      window.location.hash = `doc=${encodeURIComponent(newId)}`;
    }
  };

  const handleSelectDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      setCurrentDocTitle(doc.title);
    }
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
    try {
      const created = await create(title, newId);
      setCurrentDocId(created.id);
      setCurrentDocTitle(created.title);
      setView('editor');
      window.location.hash = `doc=${encodeURIComponent(created.id)}`;

      setTimeout(() => {
        if (editorInstance && content) {
          editorInstance.commands.setContent(content);
        }
      }, 350);
    } catch (err) {
      console.error('Error importing content:', err);
      setCurrentDocId(newId);
      setCurrentDocTitle(title);
      setView('editor');
      window.location.hash = `doc=${encodeURIComponent(newId)}`;
    }
  };

  // Google Docs Dashboard View (https://docs.google.com/document/u/0/)
  if (view === 'dashboard') {
    return (
      <>
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
      </>
    );
  }

  // Google Docs Editor View
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f9fbfd] flex-col font-sans select-none">
      {/* Google Docs Top Header & Menus */}
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
      />

      {/* Offline Alert Banner */}
      <OfflineBanner
        isOffline={syncStatus === 'offline'}
        isSimulatedOffline={isSimulatedOffline}
        onRestore={toggleSimulatedOffline}
      />

      {/* Google Docs Editor Canvas, Toolbar, Ruler & Modals */}
      {crdtManager ? (
        <Editor
          key={currentDocId}
          crdt={crdtManager}
          onEditorReady={(editor) => setEditorInstance(editor)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#5f6368] text-sm">
          Loading document...
        </div>
      )}

      {/* Open / Upload File Modal */}
      <OpenFileModal
        onOpenDocument={handleSelectDocument}
        onImportContent={handleImportContent}
      />
    </div>
  );
};

export default App;
