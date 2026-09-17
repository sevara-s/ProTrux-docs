import { create } from 'zustand';
import { DocumentAccessMode, DocumentMetadata } from '@protrux/shared';

interface DocumentState {
  documents: DocumentMetadata[];
  currentDocId: string;
  currentDocTitle: string;
  view: 'dashboard' | 'editor';
  isLoading: boolean;
  /** HTML to inject once the next editor mounts (templates / imports). */
  pendingContent: string | null;
  accessMode: DocumentAccessMode;
  canEdit: boolean;
  isOwner: boolean;
  shareToken: string | null;
  accessDenied: boolean;
  setDocuments: (docs: DocumentMetadata[]) => void;
  setCurrentDocId: (id: string) => void;
  setCurrentDocTitle: (title: string) => void;
  setView: (view: 'dashboard' | 'editor') => void;
  setPendingContent: (content: string | null) => void;
  setAccessState: (state: {
    accessMode?: DocumentAccessMode;
    canEdit?: boolean;
    isOwner?: boolean;
    shareToken?: string | null;
    accessDenied?: boolean;
  }) => void;
  addDocument: (doc: DocumentMetadata) => void;
  updateDocTitle: (id: string, title: string) => void;
  updateDocAccess: (id: string, accessMode: DocumentAccessMode, shareToken?: string) => void;
  removeDocument: (id: string) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocId: 'welcome-doc',
  currentDocTitle: 'Welcome to ProTrux',
  view: 'dashboard',
  isLoading: false,
  pendingContent: null,
  accessMode: 'edit',
  canEdit: true,
  isOwner: false,
  shareToken: null,
  accessDenied: false,

  setDocuments: (documents) => set({ documents }),
  setCurrentDocId: (currentDocId) => set({ currentDocId }),
  setCurrentDocTitle: (currentDocTitle) => set({ currentDocTitle }),
  setView: (view) => set({ view }),
  setPendingContent: (pendingContent) => set({ pendingContent }),
  setAccessState: (state) =>
    set((prev) => ({
      accessMode: state.accessMode ?? prev.accessMode,
      canEdit: state.canEdit ?? prev.canEdit,
      isOwner: state.isOwner ?? prev.isOwner,
      shareToken: state.shareToken !== undefined ? state.shareToken : prev.shareToken,
      accessDenied: state.accessDenied ?? prev.accessDenied,
    })),

  addDocument: (doc) =>
    set((state) => ({
      documents: [doc, ...state.documents.filter((d) => d.id !== doc.id)],
    })),

  updateDocTitle: (id, title) =>
    set((state) => ({
      currentDocTitle: state.currentDocId === id ? title : state.currentDocTitle,
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, title, updatedAt: Date.now() } : d
      ),
    })),

  updateDocAccess: (id, accessMode, shareToken) =>
    set((state) => ({
      accessMode: state.currentDocId === id ? accessMode : state.accessMode,
      canEdit:
        state.currentDocId === id
          ? state.isOwner || accessMode === 'edit'
          : state.canEdit,
      shareToken:
        state.currentDocId === id && shareToken !== undefined
          ? shareToken
          : state.shareToken,
      documents: state.documents.map((d) =>
        d.id === id
          ? {
              ...d,
              accessMode,
              shareToken: shareToken !== undefined ? shareToken : d.shareToken,
              updatedAt: Date.now(),
            }
          : d
      ),
    })),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    })),
}));
