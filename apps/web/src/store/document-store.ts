import { create } from 'zustand';
import { DocumentMetadata } from '@protrux/shared';

interface DocumentState {
  documents: DocumentMetadata[];
  currentDocId: string;
  currentDocTitle: string;
  view: 'dashboard' | 'editor';
  isLoading: boolean;
  setDocuments: (docs: DocumentMetadata[]) => void;
  setCurrentDocId: (id: string) => void;
  setCurrentDocTitle: (title: string) => void;
  setView: (view: 'dashboard' | 'editor') => void;
  addDocument: (doc: DocumentMetadata) => void;
  updateDocTitle: (id: string, title: string) => void;
  removeDocument: (id: string) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocId: 'welcome-doc',
  currentDocTitle: 'Welcome to ProTrux Collaborative Docs',
  view: 'dashboard',
  isLoading: false,

  setDocuments: (documents) => set({ documents }),
  setCurrentDocId: (currentDocId) => set({ currentDocId }),
  setCurrentDocTitle: (currentDocTitle) => set({ currentDocTitle }),
  setView: (view) => set({ view }),

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

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    })),
}));
