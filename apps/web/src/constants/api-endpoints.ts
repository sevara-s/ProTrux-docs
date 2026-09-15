export const API_BASE = '/api';

export const ENDPOINTS = {
  HEALTH: `${API_BASE}/health`,
  DOCUMENTS: `${API_BASE}/documents`,
  DOCUMENT_DETAIL: (id: string) => `${API_BASE}/documents/${encodeURIComponent(id)}`,
  DOCUMENT_EXPORT: (id: string) => `${API_BASE}/documents/${encodeURIComponent(id)}/export`,
} as const;
