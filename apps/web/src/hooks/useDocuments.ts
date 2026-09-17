import { useState, useCallback, useEffect } from 'react';
import { useDocumentStore } from '@/store/document-store';
import { DocumentMetadata } from '@protrux/shared';

import {
  getDocuments,
  createDocument as apiCreateDoc,
  updateDocument as apiUpdateDoc,
  deleteDocument as apiDeleteDoc,
} from '@/services/api';
import { clearDocumentIndexedDB } from '@/services/crdt';
import {
  mergeWithLocalDocuments,
  queueLocalDocument,
  removeLocalDocument,
  updateLocalDocumentTitle,
  listLocalDocuments,
} from '@/services/local-docs';

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
      setDocuments(mergeWithLocalDocuments(data));
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch documents');
      // Stay usable offline: keep queued local folios visible
      setDocuments(mergeWithLocalDocuments([]));
    } finally {
      setLoading(false);
    }
  }, [setDocuments]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // When back online, retry creating any queued local-only folios
  useEffect(() => {
    const flushQueue = async () => {
      const pending = listLocalDocuments();
      for (const doc of pending) {
        try {
          await apiCreateDoc(doc.title, doc.id);
          removeLocalDocument(doc.id);
        } catch {
          // still offline / server error — keep queued
        }
      }
      void refetch();
    };

    const onOnline = () => void flushQueue();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refetch]);

  const create = async (title: string, id?: string) => {
    try {
      const newDoc = await apiCreateDoc(title, id);
      removeLocalDocument(newDoc.id);
      addDocument({ ...newDoc, isOwner: true });
      return { ...newDoc, isOwner: true };
    } catch {
      const now = Date.now();
      const localDoc: DocumentMetadata = {
        id: id || `doc-${now}`,
        title,
        createdAt: now,
        updatedAt: now,
        previewText: 'Local draft — syncs when the link returns',
        accessMode: 'edit',
        isOwner: true,
      };
      queueLocalDocument(localDoc);
      addDocument(localDoc);
      return localDoc;
    }
  };

  const rename = async (id: string, newTitle: string) => {
    updateDocTitle(id, newTitle);
    updateLocalDocumentTitle(id, newTitle);
    try {
      await apiUpdateDoc(id, { title: newTitle });
    } catch (err) {
      console.error('Failed to update title on server:', err);
    }
  };

  const remove = async (id: string) => {
    removeDocument(id);
    removeLocalDocument(id);
    try {
      await apiDeleteDoc(id);
    } catch (err) {
      console.error('Failed to delete document on server:', err);
    }
    await clearDocumentIndexedDB(id);
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
