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
import { AppDialog } from '@/components/AppDialog';
import { PresenceToasts } from '@/components/PresenceToasts';
import { JoinIdentityModal } from '@/components/JoinIdentityModal';
import { confirmDialog } from '@/store/dialog-store';
import { getDocument } from '@/services/api';
import { DocumentAccessMode, DocumentTemplate } from '@protrux/shared';
import { Lock, Hexagon } from 'lucide-react';

function readHashParams(): { doc: string | null; shareToken: string | null } {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return { doc: null, shareToken: null };
  const params = new URLSearchParams(hash);
  return {
    doc: params.get('doc'),
    shareToken: params.get('k'),
  };
}

export const App: React.FC = () => {
  const { documents, create, remove, rename, refetch } = useDocuments();

  const view = useDocumentStore((state) => state.view);
  const setView = useDocumentStore((state) => state.setView);
  const currentDocId = useDocumentStore((state) => state.currentDocId);
  const setCurrentDocId = useDocumentStore((state) => state.setCurrentDocId);
  const setCurrentDocTitle = useDocumentStore((state) => state.setCurrentDocTitle);
  const setPendingContent = useDocumentStore((state) => state.setPendingContent);
  const setAccessState = useDocumentStore((state) => state.setAccessState);
  const accessDenied = useDocumentStore((state) => state.accessDenied);
  const canEdit = useDocumentStore((state) => state.canEdit);

  const currentUser = useUserStore((state) => state.currentUser);
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);
  const hasChosenIdentity = useUserStore((state) => state.hasChosenIdentity);
  const markIdentityChosen = useUserStore((state) => state.markIdentityChosen);
  const isSimulatedOffline = useUserStore((state) => state.isSimulatedOffline);
  const syncStatus = useUserStore((state) => state.syncStatus);
  const toggleSimulatedOffline = useUserStore((state) => state.toggleSimulatedOffline);

  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const didInitHash = useRef(false);
  const shareTokenRef = useRef<string | null>(null);

  const crdtManager = useCRDT(view === 'editor' && !accessDenied ? currentDocId : '');

  useEffect(() => {
    if (view === 'dashboard') {
      void refetch();
    }
  }, [view, refetch]);

  useEffect(() => {
    const applyHash = () => {
      const { doc, shareToken } = readHashParams();
      shareTokenRef.current = shareToken;
      if (doc) {
        setCurrentDocId(doc);
        const meta = useDocumentStore.getState().documents.find((d) => d.id === doc);
        if (meta) setCurrentDocTitle(meta.title);
        setView('editor');
      } else if (didInitHash.current) {
        setView('dashboard');
        setAccessState({ accessDenied: false, canEdit: true, accessMode: 'edit' });
      }
    };

    applyHash();
    didInitHash.current = true;

    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [setCurrentDocId, setCurrentDocTitle, setView, setAccessState]);

  // Resolve access whenever we enter the editor for a document
  useEffect(() => {
    if (view !== 'editor' || !currentDocId) return;

    let cancelled = false;
    setAccessLoading(true);
    setAccessState({ accessDenied: false });

    void (async () => {
      try {
        const meta = await getDocument(currentDocId, shareTokenRef.current);
        if (cancelled) return;
        setCurrentDocTitle(meta.title);
        const mode = (meta.accessMode || 'edit') as DocumentAccessMode;
        setAccessState({
          accessMode: mode,
          canEdit: meta.canEdit ?? (Boolean(meta.isOwner) || mode === 'edit'),
          isOwner: !!meta.isOwner,
          shareToken: meta.shareToken ?? null,
          accessDenied: false,
        });
      } catch (err: any) {
        if (cancelled) return;
        if (err?.code === 'private') {
          setAccessState({
            accessDenied: true,
            canEdit: false,
            accessMode: 'private',
            isOwner: false,
          });
        } else {
          // Offline / missing API — allow local edit so drafts still work
          const local = useDocumentStore.getState().documents.find((d) => d.id === currentDocId);
          const mode = (local?.accessMode || 'edit') as DocumentAccessMode;
          setAccessState({
            accessDenied: false,
            canEdit: local?.isOwner || mode === 'edit',
            accessMode: mode,
            isOwner: !!local?.isOwner,
            shareToken: local?.shareToken ?? null,
          });
          if (local) setCurrentDocTitle(local.title);
        }
      } finally {
        if (!cancelled) setAccessLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [view, currentDocId, setAccessState, setCurrentDocTitle]);

  useEffect(() => {
    if (view !== 'editor') return;
    const meta = documents.find((d) => d.id === currentDocId);
    if (meta) setCurrentDocTitle(meta.title);
  }, [documents, currentDocId, view, setCurrentDocTitle]);

  const handleCreateFromTemplate = async (template: DocumentTemplate) => {
    const newId = `doc-${Date.now()}`;
    const initialTitle = template.id === 'blank' ? 'Untitled document' : template.name;

    const created = await create(initialTitle, newId);
    if (template.content && template.id !== 'blank') {
      setPendingContent(template.content);
    } else {
      setPendingContent(null);
    }
    setCurrentDocId(created.id);
    setCurrentDocTitle(created.title);
    setAccessState({
      accessMode: (created.accessMode as DocumentAccessMode) || 'edit',
      canEdit: true,
      isOwner: true,
      shareToken: created.shareToken ?? null,
      accessDenied: false,
    });
    setView('editor');
    window.location.hash = `doc=${encodeURIComponent(created.id)}`;
  };

  const handleSelectDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      setCurrentDocTitle(doc.title);
    }
    setPendingContent(null);
    shareTokenRef.current = null;
    setCurrentDocId(id);
    setView('editor');
    window.location.hash = `doc=${encodeURIComponent(id)}`;
  };

  const handleDeleteDocument = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await confirmDialog({
      title: 'Move to trash?',
      message: 'This removes the document from your library. CRDT history on the server will be deleted.',
      confirmLabel: 'Move to trash',
      cancelLabel: 'Keep document',
      danger: true,
    });
    if (!ok) return;

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
    setAccessState({
      accessMode: 'edit',
      canEdit: true,
      isOwner: true,
      shareToken: created.shareToken ?? null,
      accessDenied: false,
    });
    setView('editor');
    window.location.hash = `doc=${encodeURIComponent(created.id)}`;
  };

  const handleRename = async (id: string, title: string) => {
    if (!canEdit) return;
    await rename(id, title);
  };

  const goHome = () => {
    setView('dashboard');
    setAccessState({ accessDenied: false });
    window.location.hash = '';
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
        <AppDialog />
        <PresenceToasts />
      </ErrorBoundary>
    );
  }

  if (accessDenied) {
    return (
      <ErrorBoundary fallbackTitle="Access error">
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center mb-5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2 mb-3 text-fg">
            <Hexagon className="w-4 h-4 text-accent" />
            <span className="ptx-mark text-lg">ProTrux</span>
          </div>
          <h1 className="ptx-mark text-3xl text-fg mb-2">Private document</h1>
          <p className="text-sm text-fg-muted max-w-sm mb-6">
            Only the owner can open this file. Ask them to set access to View or Edit and share the link.
          </p>
          <button type="button" onClick={goHome} className="ptx-btn ptx-btn--accent">
            Back to library
          </button>
        </div>
        <AppDialog />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Editor error">
      <div className="flex h-screen w-screen overflow-hidden ptx-desk flex-col font-sans select-none">
        <DocsHeader
          editor={editorInstance}
          onNavigateHome={goHome}
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

        {accessLoading || !crdtManager ? (
          <div className="flex-1 flex items-center justify-center text-fg-muted text-sm font-medium">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-elevated border border-line shadow-soft">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" />
              Loading document…
            </div>
          </div>
        ) : (
          <Editor
            key={`${currentDocId}-${crdtManager.ydoc.clientID}`}
            crdt={crdtManager}
            onEditorReady={(editor) => setEditorInstance(editor)}
          />
        )}

        <OpenFileModal
          onOpenDocument={handleSelectDocument}
          onImportContent={handleImportContent}
        />
        <AppDialog />
        <PresenceToasts />
        <JoinIdentityModal
          isOpen={view === 'editor' && !hasChosenIdentity && !accessDenied}
          initialName={currentUser.name}
          initialColor={currentUser.color}
          onContinue={(user) => {
            setCurrentUser(user);
            markIdentityChosen();
            editorInstance?.commands?.updateUser?.(user);
          }}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
