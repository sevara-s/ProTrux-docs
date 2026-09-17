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
  GitBranch,
} from 'lucide-react';
import { DocumentAccessMode, DocumentMetadata, TEMPLATES, DocumentTemplate } from '@protrux/shared';
import { formatRelativeTime } from '@/lib/utils';
import { useModalStore } from '@/store/modal-store';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DocsDashboardProps {
  documents: DocumentMetadata[];
  onSelectDocument: (id: string) => void;
  onCreateFromTemplate: (template: DocumentTemplate) => void;
  onDeleteDocument: (id: string, e: React.MouseEvent) => void;
  currentUser: { name: string; color: string };
}

const ACCESS_BADGE: Record<DocumentAccessMode, { label: string; icon: React.ReactNode }> = {
  private: { label: 'Private', icon: <Lock className="w-3 h-3" /> },
  view: { label: 'View link', icon: <Eye className="w-3 h-3" /> },
  edit: { label: 'Edit link', icon: <Pencil className="w-3 h-3" /> },
};

/** Mini paper mockups — readable at a glance like Docs template tiles. */
function TemplatePreview({ id }: { id: string }) {
  const sheet =
    'w-[108px] h-[136px] bg-[#fffcf7] shadow-[0_10px_28px_-12px_rgba(0,0,0,0.7)] relative overflow-hidden text-left';

  if (id === 'blank') {
    return (
      <div className={sheet}>
        <div className="absolute inset-x-3 top-4 space-y-1.5 opacity-25">
          {[100, 88, 92, 70, 85].map((w, i) => (
            <div key={i} className="h-[3px] rounded-full bg-[#16181d]" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-7 h-7 rounded-full border border-dashed border-[#c8890a]/50 flex items-center justify-center text-[#c8890a] text-lg font-light leading-none">
            +
          </span>
        </div>
      </div>
    );
  }

  if (id === 'project-proposal') {
    return (
      <div className={`${sheet} px-2.5 pt-3`}>
        <div className="h-2 w-[72%] bg-[#16181d] rounded-sm mb-1.5" />
        <div className="h-[3px] w-[50%] bg-[#c8890a]/70 rounded-full mb-2.5" />
        <div className="space-y-1 mb-2">
          <div className="h-[2px] w-full bg-[#16181d]/20 rounded-full" />
          <div className="h-[2px] w-[90%] bg-[#16181d]/20 rounded-full" />
        </div>
        <div className="h-[3px] w-[40%] bg-[#c8890a] rounded-full mb-1.5" />
        <div className="space-y-1">
          <div className="h-[2px] w-full bg-[#16181d]/18 rounded-full" />
          <div className="h-[2px] w-[95%] bg-[#16181d]/18 rounded-full" />
          <div className="h-[2px] w-[80%] bg-[#16181d]/18 rounded-full" />
        </div>
        <div className="mt-2.5 border-l-2 border-[#c8890a]/50 pl-1.5 space-y-1">
          <div className="h-[2px] w-[85%] bg-[#16181d]/15 rounded-full" />
          <div className="h-[2px] w-[70%] bg-[#16181d]/15 rounded-full" />
        </div>
      </div>
    );
  }

  if (id === 'resume') {
    return (
      <div className={`${sheet} px-2.5 pt-3`}>
        <div className="h-2.5 w-[68%] bg-[#16181d] rounded-sm mx-auto mb-1" />
        <div className="h-[2px] w-[78%] bg-[#16181d]/25 rounded-full mx-auto mb-2.5" />
        <div className="h-px w-full bg-[#c8890a]/40 mb-2" />
        <div className="h-[3px] w-[36%] bg-[#c8890a] rounded-full mb-1.5 tracking-wide" />
        <div className="space-y-1 mb-2">
          <div className="h-[2px] w-full bg-[#16181d]/18 rounded-full" />
          <div className="h-[2px] w-[92%] bg-[#16181d]/18 rounded-full" />
        </div>
        <div className="h-[3px] w-[42%] bg-[#c8890a] rounded-full mb-1.5" />
        <div className="flex gap-1 mb-1">
          <div className="h-[2px] w-1 bg-[#16181d]/30 rounded-full" />
          <div className="h-[2px] flex-1 bg-[#16181d]/15 rounded-full" />
        </div>
        <div className="flex gap-1 mb-1">
          <div className="h-[2px] w-1 bg-[#16181d]/30 rounded-full" />
          <div className="h-[2px] flex-1 bg-[#16181d]/15 rounded-full" />
        </div>
        <div className="flex gap-1">
          <div className="h-[2px] w-1 bg-[#16181d]/30 rounded-full" />
          <div className="h-[2px] w-[70%] bg-[#16181d]/15 rounded-full" />
        </div>
      </div>
    );
  }

  if (id === 'meeting-notes') {
    return (
      <div className={`${sheet} px-2.5 pt-3`}>
        <div className="h-2 w-[80%] bg-[#16181d] rounded-sm mb-1" />
        <div className="h-[2px] w-[55%] bg-[#16181d]/25 rounded-full mb-2.5" />
        <div className="h-[3px] w-[38%] bg-[#c8890a] rounded-full mb-1.5" />
        <div className="space-y-1.5 mb-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-[2px] border border-[#c8890a]/70 shrink-0" />
              <div className="h-[2px] flex-1 bg-[#16181d]/18 rounded-full" />
            </div>
          ))}
        </div>
        <div className="h-[3px] w-[34%] bg-[#c8890a] rounded-full mb-1.5" />
        <div className="space-y-1">
          <div className="h-[2px] w-full bg-[#16181d]/15 rounded-full" />
          <div className="h-[2px] w-[88%] bg-[#16181d]/15 rounded-full" />
        </div>
      </div>
    );
  }

  // newsletter
  return (
    <div className={`${sheet} px-2.5 pt-3`}>
      <div className="h-[3px] w-[48%] bg-[#c8890a] rounded-full mb-1.5 mx-auto" />
      <div className="h-2.5 w-[85%] bg-[#16181d] rounded-sm mx-auto mb-1" />
      <div className="h-[2px] w-[40%] bg-[#16181d]/25 rounded-full mx-auto mb-2.5" />
      <div className="h-8 w-full rounded-sm mb-2 border border-[#16181d]/10" style={{ background: 'rgba(22,24,29,0.06)' }} />
      <div className="space-y-1">
        <div className="h-[2px] w-full bg-[#16181d]/18 rounded-full" />
        <div className="h-[2px] w-[95%] bg-[#16181d]/18 rounded-full" />
        <div className="h-[2px] w-[78%] bg-[#16181d]/18 rounded-full" />
      </div>
      <div className="mt-2 flex gap-1">
        <div className="h-3 flex-1 bg-[#c8890a]/15 rounded-sm" />
        <div className="h-3 flex-1 rounded-sm" style={{ background: 'rgba(22,24,29,0.06)' }} />
      </div>
    </div>
  );
}

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

  return (
    <div className="min-h-screen bg-canvas text-fg font-sans flex flex-col select-none overflow-x-hidden">
      <header className="ptx-workspace-bar sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-md bg-accent text-accent-fg flex items-center justify-center shrink-0">
              <Hexagon className="w-4 h-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 leading-none">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <h1 className="ptx-mark text-xl text-chrome-fg tracking-tight">ProTrux</h1>
                <span className="ptx-signal text-accent hidden sm:inline">Signal desk</span>
              </div>
              <p className="mt-1 text-[11px] text-chrome-muted truncate hidden md:block">
                Local-first pages · live merge
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onCreateFromTemplate(TEMPLATES[0])}
              className="ptx-btn ptx-btn--accent rounded-md !py-2 !px-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              New page
            </button>
            <button
              type="button"
              onClick={() => useModalStore.getState().openModal('open-file')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border border-white/15 bg-white/5 text-chrome-fg hover:bg-white/10 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
            <ThemeToggle compact className="hidden sm:inline-flex" />
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold text-accent-fg ring-1 ring-accent/40"
              style={{ backgroundColor: currentUser.color }}
              title={currentUser.name}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <section className="px-6 md:px-12 pt-8 mb-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="ptx-signal mb-1">Specimens</p>
              <h2 className="ptx-mark text-2xl md:text-3xl text-fg">Start from a sheet</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {TEMPLATES.map((tmpl, i) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onCreateFromTemplate(tmpl)}
                className="snap-start shrink-0 w-[168px] text-left group animate-rise-in"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="rounded-md border border-line bg-[#12141a] overflow-hidden shadow-soft group-hover:-translate-y-1 group-hover:shadow-lift transition-all duration-300">
                  <div className="h-[148px] p-3 flex items-center justify-center relative">
                    <div className="absolute inset-0 opacity-40 pointer-events-none bg-[linear-gradient(rgba(243,239,230,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(243,239,230,0.04)_1px,transparent_1px)] bg-[size:14px_14px]" />
                    <TemplatePreview id={tmpl.id} />
                  </div>
                  <div className="px-3 py-2.5 border-t border-white/10 bg-elevated">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-fg-muted mb-0.5">
                      {tmpl.category}
                    </p>
                    <p className="ptx-mark text-sm text-fg leading-tight group-hover:text-accent transition-colors truncate">
                      {tmpl.name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex-1 px-6 md:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between mb-7">
            <div>
              <p className="ptx-signal mb-1">Library</p>
              <h2 className="ptx-mark text-2xl md:text-3xl text-fg">On this desk</h2>
              <p className="text-sm text-fg-muted mt-1 font-mono">
                {filteredDocs.length} sheet{filteredDocs.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
                <input
                  type="search"
                  placeholder="Find a page…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ptx-input rounded-md"
                />
              </div>
              <div className="flex rounded-md overflow-hidden border border-line bg-elevated">
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
            <div className="py-20 text-center border border-dashed border-line rounded-md bg-surface/60">
              <FileText className="w-8 h-8 text-fg-muted mx-auto mb-3" />
              <p className="ptx-mark text-2xl text-fg">Empty desk</p>
              <p className="text-sm text-fg-muted mt-1">Pull a specimen or start a blank page.</p>
            </div>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc, i) => {
                const mode = (doc.accessMode || 'edit') as DocumentAccessMode;
                const badge = ACCESS_BADGE[mode];
                const live = Boolean(doc.activeUsersCount);
                return (
                  <article
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className="ptx-panel group cursor-pointer overflow-hidden animate-rise-in !rounded-md"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <div className="h-36 bg-[#12141a] border-b border-line p-4 relative">
                      <div className="absolute inset-3 bg-[#fffcf7] shadow-[0_12px_40px_-20px_rgba(0,0,0,0.8)] p-3 overflow-hidden">
                        <p className="font-serif text-[11px] text-[#16181d]/70 line-clamp-5 leading-relaxed">
                          {doc.previewText || 'Untitled draft waiting for its first sentence…'}
                        </p>
                      </div>
                      {live && (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider bg-accent text-accent-fg px-1.5 py-0.5 rounded-sm z-10">
                          <GitBranch className="w-2.5 h-2.5" />
                          Live
                        </span>
                      )}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider bg-accent text-accent-fg px-2 py-1 rounded-sm">
                          Open <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="ptx-mark text-xl text-fg truncate group-hover:text-accent transition-colors">
                          {doc.title || 'Untitled document'}
                        </h3>
                        <p className="text-[11px] font-mono text-fg-muted mt-1 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                            {badge.icon}
                            {badge.label}
                          </span>
                          <span>·</span>
                          <span>{formatRelativeTime(doc.updatedAt)}</span>
                          {live ? (
                            <>
                              <span>·</span>
                              <span>{doc.activeUsersCount} peer{(doc.activeUsersCount || 0) === 1 ? '' : 's'}</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => onDeleteDocument(doc.id, e)}
                        className="p-2 rounded-md text-fg-muted hover:text-accent hover:bg-accent-soft transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-line overflow-hidden bg-elevated shadow-soft divide-y divide-line">
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
                      <div className="w-9 h-9 rounded-md bg-accent-soft text-accent flex items-center justify-center shrink-0">
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
                      className="p-2 rounded-md text-fg-muted hover:text-accent hover:bg-accent-soft"
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
