import type { DocumentAccessMode } from '@protrux/shared';

export type AccessDoc = {
  accessMode?: string;
  ownerKey?: string | null;
  shareToken?: string | null;
};

export function readOwnerKey(req: {
  headers: Record<string, unknown>;
  query?: unknown;
}): string | undefined {
  const header = req.headers['x-owner-key'];
  if (typeof header === 'string' && header.trim()) return header.trim();
  const q = (req.query || {}) as { ownerKey?: string };
  if (typeof q.ownerKey === 'string' && q.ownerKey.trim()) return q.ownerKey.trim();
  return undefined;
}

export function readShareToken(req: { query?: unknown; url?: string }): string | undefined {
  const q = (req.query || {}) as { k?: string; shareToken?: string };
  const fromQuery = q.k || q.shareToken;
  if (typeof fromQuery === 'string' && fromQuery.trim()) return fromQuery.trim();

  if (typeof req.url === 'string' && req.url.includes('?')) {
    const params = new URLSearchParams(req.url.split('?')[1]);
    const k = params.get('k') || params.get('shareToken');
    if (k?.trim()) return k.trim();
  }
  return undefined;
}

export function readOwnerKeyFromUrl(url: string): string | undefined {
  if (!url.includes('?')) return undefined;
  const params = new URLSearchParams(url.split('?')[1]);
  const key = params.get('ownerKey');
  return key?.trim() || undefined;
}

/**
 * Who may open the document (REST GET / WebSocket connect).
 *
 * Policy (enforced on REST + WS — not demo-only):
 * - Owner always opens
 * - private → owner only
 * - view / edit → anyone with the document link (doc id) may open
 *   (optional `k` still accepted; wrong `k` is rejected)
 */
export function canOpenDocument(
  doc: AccessDoc,
  ownerKey?: string,
  shareToken?: string
): boolean {
  if (ownerKey && doc.ownerKey && ownerKey === doc.ownerKey) return true;

  const mode = (doc.accessMode || 'edit') as DocumentAccessMode;
  if (mode === 'private') return false;

  // Explicit wrong token → reject; missing token is OK for view/edit links
  if (shareToken && doc.shareToken && shareToken !== doc.shareToken) {
    return false;
  }

  return true;
}

/** Who may mutate metadata / CRDT content (owners always; edit links for guests). */
export function canEditDocument(doc: AccessDoc, ownerKey?: string): boolean {
  if (ownerKey && doc.ownerKey && ownerKey === doc.ownerKey) return true;
  return (doc.accessMode || 'edit') === 'edit';
}

export function resolveWsAccess(
  doc: AccessDoc | null | undefined,
  ownerKey?: string,
  shareToken?: string
): { canOpen: boolean; canEdit: boolean; reason?: string } {
  if (!doc) {
    return { canOpen: false, canEdit: false, reason: 'Document not found' };
  }
  if (!canOpenDocument(doc, ownerKey, shareToken)) {
    return {
      canOpen: false,
      canEdit: false,
      reason: doc.accessMode === 'private' ? 'This document is private' : 'Invalid share link',
    };
  }
  return {
    canOpen: true,
    canEdit: canEditDocument(doc, ownerKey),
  };
}
