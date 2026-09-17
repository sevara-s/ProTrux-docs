export interface DocumentMetadata {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  previewText?: string;
  activeUsersCount?: number;
  /** private = owner only; view = link can read; edit = link can write */
  accessMode?: DocumentAccessMode;
  /** Present for the owner only — used when building share links. */
  shareToken?: string;
  /** True when the requesting client owns this document. */
  isOwner?: boolean;
}

/** Who can open / change the document via the share link. */
export type DocumentAccessMode = 'private' | 'view' | 'edit';

export const DOCUMENT_ACCESS_OPTIONS: {
  id: DocumentAccessMode;
  label: string;
  description: string;
}[] = [
  {
    id: 'private',
    label: 'Private',
    description: 'Only you can open this document from your library.',
  },
  {
    id: 'view',
    label: 'Anyone with the link can view',
    description: 'Peers can open and read, but cannot edit.',
  },
  {
    id: 'edit',
    label: 'Anyone with the link can edit',
    description: 'Peers can open and edit together in real time.',
  },
];


export interface UserPresence {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  cursor?: {
    anchor: number;
    head: number;
  } | null;
  lastActive: number;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'connecting' | 'error';

export interface DocumentExport {
  id: string;
  title: string;
  html: string;
  markdown: string;
  plainText: string;
  updatedAt: number;
}

export const USER_PALETTES = [
  { name: 'Ink', color: '#13201c', light: '#dde6e2' },
  { name: 'Deep forest', color: '#164f42', light: '#d5e8e1' },
  { name: 'Forest', color: '#1f6f5c', light: '#d8ebe4' },
  { name: 'Fern', color: '#3d8f7a', light: '#dff0ea' },
  { name: 'Sage', color: '#5aab94', light: '#e6f3ee' },
];

export const DEFAULT_DOCUMENT_CONTENT = `<h1>Write in parallel.</h1>
<p>Welcome to <strong>ProTrux</strong> — a local-first collaborative document editor built on mathematical CRDT consistency.</p>
<h2>What you can demonstrate</h2>
<ul>
  <li><strong>Live sync:</strong> Binary Yjs deltas over WebSockets — peers see each keystroke without reload.</li>
  <li><strong>Offline mode:</strong> IndexedDB keeps drafts through refresh; reconnect merges without overwrites.</li>
  <li><strong>Deterministic merge:</strong> State-vector CRDTs guarantee strong eventual consistency.</li>
  <li><strong>Presence:</strong> Named carets, selection highlights, and live collaborators.</li>
</ul>
<blockquote>"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra</blockquote>
<p>Open a second tab, switch persona, hit offline, and watch both branches converge.</p>`;

export function getRandomUser(): { name: string; color: string } {
  const names = [
    'Elena Rostova',
    'Liam Chen',
    'Amara Okafor',
    'Marcus Vance',
    'Sofia Lindqvist',
    'Dmitri Volkov',
    'Kavita Patel',
    'Lucas Silva',
    'Aria Sterling',
    'Kai Takahashi',
  ];
  const palette = USER_PALETTES[Math.floor(Math.random() * USER_PALETTES.length)];
  const name = names[Math.floor(Math.random() * names.length)];
  return { name, color: palette.color };
}

/** Normalize document IDs so REST metadata and WebSocket rooms always match. */
export function normalizeDocId(raw: string): string {
  const cleaned = decodeURIComponent(String(raw || ''))
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120);
  return cleaned || 'welcome-doc';
}

export * from './templates.js';

