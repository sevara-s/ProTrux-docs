import { DocumentMetadata } from '@protrux/shared';

const LOCAL_DOCS_KEY = 'protrux_local_docs';

function readAll(): DocumentMetadata[] {
  try {
    const raw = localStorage.getItem(LOCAL_DOCS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(docs: DocumentMetadata[]) {
  try {
    localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(docs));
  } catch {
    // ignore quota / private mode
  }
}

/** Queue a folio created while REST was unreachable. */
export function queueLocalDocument(doc: DocumentMetadata) {
  const docs = readAll().filter((d) => d.id !== doc.id);
  docs.unshift(doc);
  writeAll(docs);
}

export function listLocalDocuments(): DocumentMetadata[] {
  return readAll();
}

export function removeLocalDocument(id: string) {
  writeAll(readAll().filter((d) => d.id !== id));
}

export function updateLocalDocumentTitle(id: string, title: string) {
  writeAll(
    readAll().map((d) =>
      d.id === id ? { ...d, title, updatedAt: Date.now() } : d
    )
  );
}

/** Merge server list with queued offline creates (local wins on id collision). */
export function mergeWithLocalDocuments(
  serverDocs: DocumentMetadata[]
): DocumentMetadata[] {
  const local = readAll();
  if (local.length === 0) return serverDocs;

  const serverIds = new Set(serverDocs.map((d) => d.id));
  const pending = local.filter((d) => !serverIds.has(d.id));
  // Drop local rows that already exist on the server
  const stillPending = local.filter((d) => !serverIds.has(d.id));
  writeAll(stillPending);

  return [...pending, ...serverDocs].sort((a, b) => b.updatedAt - a.updatedAt);
}
