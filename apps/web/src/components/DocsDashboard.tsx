import React, { useState } from 'react';
import {
  Search,
  Grid,
  List as ListIcon,
  Folder,
  MoreVertical,
  ChevronDown,
  Plus,
  ArrowUpDown,
  FileText,
  Trash2,
  Edit2,
  ExternalLink,
  Menu,
  Sparkles,
} from 'lucide-react';
import { DocumentMetadata, TEMPLATES, DocumentTemplate } from '@protrux/shared';
import { useModalStore } from '@/store/modal-store';

interface DocsDashboardProps {
  documents: DocumentMetadata[];
  onSelectDocument: (id: string) => void;
  onCreateFromTemplate: (template: DocumentTemplate) => void;
  onDeleteDocument: (id: string, e: React.MouseEvent) => void;
  currentUser: { name: string; color: string };
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
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRelativeTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans flex flex-col select-none">
      {/* 1. ProTrux Canvas App Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-stone-200/80 sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-2xs">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-stone-900 tracking-tight">ProTrux Canvas</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
              Workspace
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl mx-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-stone-400 group-focus-within:text-indigo-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search documents or templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2 bg-stone-100/80 focus:bg-white text-xs text-stone-800 rounded-xl border border-transparent focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:shadow-xs transition-all placeholder-stone-400"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="text-[10px] text-stone-400 font-mono bg-stone-200/60 px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Right: User Profile Avatar */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-xs cursor-pointer ring-2 ring-white"
            style={{ backgroundColor: currentUser.color }}
            title={`Active Persona: ${currentUser.name}`}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* 2. Template Gallery Section */}
      <section className="bg-[#f7f6f2] border-b border-stone-200/80 py-8 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-stone-900 tracking-tight">Start a new document</h2>
              <p className="text-xs text-stone-500 mt-0.5">Choose a pre-structured template or begin with a clean editorial page</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span className="text-[11px] font-medium text-stone-500">5 templates ready</span>
            </div>
          </div>

          {/* Template Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => onCreateFromTemplate(tmpl)}
                className="group cursor-pointer flex flex-col"
              >
                {/* Card preview paper */}
                <div className="w-full aspect-[3/4] bg-white border border-stone-200/90 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all overflow-hidden relative shadow-2xs group-hover:-translate-y-0.5 flex flex-col justify-between p-3.5">
                  {tmpl.id === 'blank' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <span className="text-[11px] font-medium text-stone-500">Blank Page</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col">
                      <div
                        className="w-full h-1.5 rounded-full mb-2.5"
                        style={{ backgroundColor: tmpl.thumbnailColor }}
                      />
                      <div className="space-y-1.5 opacity-70">
                        <div className="w-3/4 h-2 bg-stone-300 rounded-xs" />
                        <div className="w-full h-1.5 bg-stone-200 rounded-xs" />
                        <div className="w-5/6 h-1.5 bg-stone-200 rounded-xs" />
                        <div className="w-4/6 h-1.5 bg-stone-200 rounded-xs" />
                      </div>
                      <div className="mt-auto pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 font-medium">
                        <span>{tmpl.category}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Title */}
                <div className="mt-2 px-0.5">
                  <p className="text-xs font-semibold text-stone-800 group-hover:text-indigo-600 truncate transition-colors">
                    {tmpl.name}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">{tmpl.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Recent Documents Section */}
      <section className="flex-1 py-8 px-6 md:px-12 lg:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Controls bar */}
          <div className="flex items-center justify-between mb-6 text-xs text-stone-600 pb-3 border-b border-stone-200">
            <div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">Recent documents</h2>
              <p className="text-xs text-stone-500 mt-0.5">Synced with local IndexedDB and cloud CRDT peers</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => useModalStore.getState().openModal('open-file')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-medium text-stone-700 transition-colors shadow-2xs"
                title="Import Word (.docx), Markdown (.md), HTML, or Text"
              >
                <Folder className="w-3.5 h-3.5 text-stone-500" />
                <span>Import File</span>
              </button>

              <div className="flex items-center gap-1 border-l border-stone-200 pl-3">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${viewMode === 'grid' ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-stone-500'}`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md hover:bg-stone-100 transition-colors ${viewMode === 'list' ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-stone-500'}`}
                  title="List view"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Empty state if search returned 0 matches */}
          {filteredDocs.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-stone-700">No documents found</p>
              <p className="text-xs text-stone-500 mt-1">Try searching with different keywords or create a new document above.</p>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className="group bg-white border border-stone-200/90 hover:border-indigo-500 rounded-xl overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all flex flex-col"
                >
                  {/* Miniature Paper View */}
                  <div className="w-full aspect-[4/3] bg-stone-50/80 border-b border-stone-100 p-3.5 flex flex-col justify-start overflow-hidden">
                    <p className="text-[10px] text-stone-600 line-clamp-4 leading-relaxed font-sans select-none">
                      {doc.previewText || 'No text preview available. Click to open and begin writing...'}
                    </p>
                  </div>

                  {/* Document Card Footer */}
                  <div className="p-3 bg-white flex items-center justify-between relative">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-stone-900 truncate group-hover:text-indigo-600 transition-colors">
                          {doc.title || 'Untitled document'}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {formatRelativeTime(doc.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {/* 3-dots Context Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id);
                        }}
                        className="p-1 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuDocId === doc.id && (
                        <div
                          className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-xl shadow-xl border border-stone-200/90 py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectDocument(doc.id);
                              setActiveMenuDocId(null);
                            }}
                            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-stone-50 text-stone-700 text-left transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                            <span>Open</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              onDeleteDocument(doc.id, e);
                              setActiveMenuDocId(null);
                            }}
                            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-600 text-left transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className="group flex items-center justify-between px-4 py-3 hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-stone-900 truncate group-hover:text-indigo-600 transition-colors">
                      {doc.title || 'Untitled document'}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-stone-500">
                    <span className="text-[11px]">{formatRelativeTime(doc.updatedAt)}</span>
                    <button
                      type="button"
                      onClick={(e) => onDeleteDocument(doc.id, e)}
                      className="p-1.5 rounded-md hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
