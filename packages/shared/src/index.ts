export interface DocumentMetadata {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  previewText?: string;
  activeUsersCount?: number;
}

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
  { name: 'Amber', color: '#f59e0b', light: '#fef3c7' },
  { name: 'Emerald', color: '#10b981', light: '#d1fae5' },
  { name: 'Sky', color: '#0ea5e9', light: '#e0f2fe' },
  { name: 'Violet', color: '#8b5cf6', light: '#ede9fe' },
  { name: 'Rose', color: '#f43f5e', light: '#ffe4e6' },
  { name: 'Indigo', color: '#6366f1', light: '#e0e7ff' },
  { name: 'Teal', color: '#14b8a6', light: '#ccfbf1' },
  { name: 'Orange', color: '#f97316', light: '#ffedd5' },
];

export const DEFAULT_DOCUMENT_CONTENT = `<h1>The Future of Collaborative Systems</h1>
<p>Welcome to <strong>ProTrux Docs</strong> — an authorial, local-first collaborative document engine designed with mathematical CRDT consistency.</p>
<h2>Key Capabilities</h2>
<ul>
  <li><strong>Real-time Synchronized Editing:</strong> Microsecond delta dissemination over binary WebSockets.</li>
  <li><strong>True Offline-First Resilience:</strong> Client-side IndexedDB persistence enables uninterrupted writing without internet connectivity.</li>
  <li><strong>Conflict-Free Deterministic Merge:</strong> State-vector commutative merging guarantees zero data loss and zero overwrites.</li>
  <li><strong>Live Presence & Cursors:</strong> Ephemeral user awareness displays remote cursor positions and text selections.</li>
</ul>
<blockquote>"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra</blockquote>
<p>Start typing or invite peers to collaborate simultaneously across tabs or devices!</p>`;

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

export * from './templates';

