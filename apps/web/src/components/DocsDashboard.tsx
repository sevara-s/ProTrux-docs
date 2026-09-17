import React, { useState } from 'react';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Upload,
  FileText,
  Trash2,
  Plus,
  ArrowUpRight,
  Hexagon,
  Lock,
  Eye,
  Pencil,
} from 'lucide-react';
import { DocumentAccessMode, DocumentMetadata, TEMPLATES, DocumentTemplate } from '@protrux/shared';
import { useModalStore } from '@/store/modal-store';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DocsDashboardProps {
  documents: DocumentMetadata[];
  onSelectDocument: (id: string) => void;
  onCreateFromTemplate: (template: DocumentTemplate) => void;
  onDeleteDocument: (id: string, e: React.MouseEvent) => void;
  currentUser: { name: string; color: string };
}

const ACCESS_BADGE: Record<
  DocumentAccessMode,
  { label: string; icon: React.ReactNode }
> = {
  private: { label: 'Private', icon: <Lock className="w-3 h-3" /> },
  view: { label: 'View link', icon: <Eye className="w-3 h-3" /> },
  edit: { label: 'Edit link', icon: <Pencil className="w-3 h-3" /> },
};

export const DocsDashboard: React.FC<DocsDashboardProps> = ({
  documents,
  onSelectDocument,
  onCreateFromTemplate,
  onDeleteDocument,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRelativeTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-canvas text-fg font-sans flex flex-col select-none overflow-x-hidden">
      {/* Compact workspace header */}
      <header className="ptx-workspace-bar sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-accent text-accent-fg flex items-center justify-center shrink-0">
              <Hexagon className="w-4 h-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="ptx-mark text-xl text-fg truncate">ProTrux</p>
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-muted">
                Your documents
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onCreateFromTemplate(TEMPLATES[0])}
              className="ptx-btn ptx-btn--accent"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              New document
            </button>
            <button
              type="button"
              onClick={() => useModalStore.getState().openModal('open-file')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-line bg-elevated text-fg hover:bg-muted transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <ThemeToggle />
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-accent-fg ring-2 ring-accent/30"
              style={{ backgroundColor: currentUser.color }}
              title={currentUser.name}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Templates */}
      <section className="px-6 md:px-12 pt-8 mb-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-fg-muted mb-1">Start</p>
              <h2 className="ptx-mark text-2xl md:text-3xl text-fg">Templates</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {TEMPLATES.map((tmpl, i) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onCreateFromTemplate(tmpl)}
                className="snap-start shrink-0 w-[200px] text-left group animate-rise-in"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="ptx-panel h-[120px] p-4 flex flex-col justify-between group-hover:-translate-y-0.5 overflow-hidden relative">
                  <div
                    className="absolute top-0 inset-x-0 h-[3px]"
                    style={{ background: 'var(--accent)' }}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">
                    {tmpl.category}
                  </span>
                  <div>
                    <p className="font-display text-lg text-fg leading-tight group-hover:text-accent transition-colors">
                      {tmpl.name}
                    </p>
                    <p className="text-[11px] text-fg-muted mt-1 line-clamp-2">{tmpl.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Library */}
      <section className="flex-1 px-6 md:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between mb-7">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-fg-muted mb-1">Library</p>
              <h2 className="ptx-mark text-2xl md:text-3xl text-fg">Recent</h2>
              <p className="text-sm text-fg-muted mt-1">
                {filteredDocs.length} document{filteredDocs.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
                <input
                  type="search"
                  placeholder="Search documents…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ptx-input"
                />
              </div>
              <div className="flex rounded-xl overflow-hidden border border-line bg-elevated">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:bg-muted'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:bg-muted'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {filteredDocs.length === 0 && (
            <div className="py-20 text-center border border-dashed border-line rounded-panel bg-surface/60">
              <FileText className="w-8 h-8 text-fg-muted mx-auto mb-3" />
              <p className="font-display text-2xl text-fg">No documents yet</p>
              <p className="text-sm text-fg-muted mt-1">Create one or refine your search.</p>
            </div>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc, i) => {
                const mode = (doc.accessMode || 'edit') as DocumentAccessMode;
                const badge = ACCESS_BADGE[mode];
                return (
                  <article
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className="ptx-panel group cursor-pointer overflow-hidden animate-rise-in"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <div className="h-32 ptx-desk border-b border-line p-4 relative">
                      <p className="font-serif text-[12px] text-fg-soft/80 line-clamp-4 leading-relaxed">
                        {doc.previewText || 'Untitled draft waiting for its first sentence…'}
                      </p>
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider bg-chrome text-accent px-2 py-1 rounded-md">
                          Open <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-xl text-fg truncate group-hover:text-accent transition-colors">
                          {doc.title || 'Untitled document'}
                        </h3>
                        <p className="text-[11px] font-mono text-fg-muted mt-1 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                            {badge.icon}
                            {badge.label}
                          </span>
                          <span>·</span>
                          <span>{formatRelativeTime(doc.updatedAt)}</span>
                          {doc.activeUsersCount ? (
                            <>
                              <span>·</span>
                              <span>{doc.activeUsersCount} live</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => onDeleteDocument(doc.id, e)}
                        className="p-2 rounded-lg text-fg-muted hover:text-accent hover:bg-accent-soft transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-panel border border-line overflow-hidden bg-elevated shadow-soft divide-y divide-line">
              {filteredDocs.map((doc) => {
                const mode = (doc.accessMode || 'edit') as DocumentAccessMode;
                const badge = ACCESS_BADGE[mode];
                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-accent-soft cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-fg truncate group-hover:text-accent">
                          {doc.title || 'Untitled document'}
                        </p>
                        <p className="text-[11px] text-fg-muted font-mono flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1">
                            {badge.icon}
                            {badge.label}
                          </span>
                          <span>·</span>
                          <span>{formatRelativeTime(doc.updatedAt)}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => onDeleteDocument(doc.id, e)}
                      className="p-2 rounded-lg text-fg-muted hover:text-accent hover:bg-accent-soft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
