import { DocumentMetadata } from '@protrux/shared';

const API_BASE = '/api';

export async function getDocuments(): Promise<DocumentMetadata[]> {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function getDocument(id: string): Promise<DocumentMetadata> {
  const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch document ${id}`);
  return res.json();
}

export async function createDocument(title?: string, id?: string): Promise<DocumentMetadata> {
  const res = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, id }),
  });
  if (!res.ok) throw new Error('Failed to create document');
  return res.json();
}

export async function updateDocument(id: string, data: { title?: string; previewText?: string }): Promise<DocumentMetadata> {
  const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update document ${id}`);
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete document ${id}`);
}
