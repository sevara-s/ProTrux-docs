import { useState, useCallback, useEffect } from 'react';
import { useDocumentStore } from '@/store/document-store';
import { getDocuments, createDocument as apiCreateDoc, updateDocument as apiUpdateDoc, deleteDocument as apiDeleteDoc } from '@/services/api';
import { DocumentMetadata, DocumentTemplate } from '@protrux/shared';

export function useDocuments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documents = useDocumentStore((state) => state.documents);
  const setDocuments = useDocumentStore((state) => state.setDocuments);
  const addDocument = useDocumentStore((state) => state.addDocument);
  const updateDocTitle = useDocumentStore((state) => state.updateDocTitle);
  const removeDocument = useDocumentStore((state) => state.removeDocument);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [setDocuments]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = async (title: string, id?: string) => {
    const newDoc = await apiCreateDoc(title, id);
    addDocument(newDoc);
    return newDoc;
  };

  const rename = async (id: string, newTitle: string) => {
    updateDocTitle(id, newTitle);
    try {
      await apiUpdateDoc(id, { title: newTitle });
    } catch (err) {
      console.error('Failed to update title on server:', err);
    }
  };

  const remove = async (id: string) => {
    removeDocument(id);
    try {
      await apiDeleteDoc(id);
    } catch (err) {
      console.error('Failed to delete document on server:', err);
    }
  };

  return {
    documents,
    loading,
    error,
    refetch,
    create,
    rename,
    remove,
  };
}
