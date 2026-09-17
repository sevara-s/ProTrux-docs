import { DocumentAccessMode, DocumentMetadata } from '@protrux/shared';
import { ENDPOINTS } from '@/constants/api-endpoints';
import { getOwnerKey, ownerHeaders } from '@/services/owner-key';

export type DocumentAccessInfo = DocumentMetadata & {
  canEdit?: boolean;
};

export async function getDocuments(): Promise<DocumentMetadata[]> {
  const res = await fetch(`${ENDPOINTS.DOCUMENTS}?ownerKey=${encodeURIComponent(getOwnerKey())}`, {
    headers: ownerHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function getDocument(
  id: string,
  shareToken?: string | null
): Promise<DocumentAccessInfo> {
  const params = new URLSearchParams({ ownerKey: getOwnerKey() });
  if (shareToken) params.set('k', shareToken);
  const res = await fetch(`${ENDPOINTS.DOCUMENT_DETAIL(id)}?${params}`, {
    headers: ownerHeaders(),
  });
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    const err = new Error((body as { error?: string }).error || 'This document is private');
    (err as Error & { code?: string }).code = 'private';
    throw err;
  }
  if (!res.ok) throw new Error(`Failed to fetch document ${id}`);
  return res.json();
}

export async function createDocument(
  title?: string,
  id?: string,
  accessMode: DocumentAccessMode = 'edit'
): Promise<DocumentMetadata> {
  const res = await fetch(ENDPOINTS.DOCUMENTS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...ownerHeaders() },
    body: JSON.stringify({ title, id, accessMode }),
  });
  if (!res.ok) throw new Error('Failed to create document');
  return res.json();
}

export async function updateDocument(
  id: string,
  data: { title?: string; previewText?: string; accessMode?: DocumentAccessMode }
): Promise<DocumentAccessInfo> {
  const res = await fetch(ENDPOINTS.DOCUMENT_DETAIL(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...ownerHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update document ${id}`);
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(ENDPOINTS.DOCUMENT_DETAIL(id), {
    method: 'DELETE',
    headers: ownerHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete document ${id}`);
}
