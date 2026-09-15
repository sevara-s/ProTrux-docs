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
    <div className="min-h-screen bg-white text-[#202124] font-sans flex flex-col select-none">
      {/* 1. Google Docs App Header */}
      <header className="h-16 px-4 flex items-center justify-between border-b border-transparent hover:border-[#dadce0] transition-colors sticky top-0 bg-white z-30">
        {/* Left: Hamburger + Google Docs Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-[#f1f3f4] text-[#5f6368]"
            title="Main menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 cursor-pointer">
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 4H10C8.89543 4 8 4.89543 8 6V34C8 35.1046 8.89543 36 10 36H30C31.1046 36 32 35.1046 32 34V11L25 4Z" fill="#4285F4"/>
              <path d="M25 4L32 11H25V4Z" fill="#A1C2FA"/>
              <rect x="13" y="16" width="14" height="2" rx="1" fill="white"/>
              <rect x="13" y="21" width="14" height="2" rx="1" fill="white"/>
              <rect x="13" y="26" width="9" height="2" rx="1" fill="white"/>
            </svg>
            <span className="text-[22px] font-normal text-[#5f6368] tracking-tight">Docs</span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#5f6368] group-focus-within:text-[#1a73e8]" />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f1f3f4] focus:bg-white text-sm text-[#202124] rounded-lg border border-transparent focus:border-transparent focus:outline-none focus:shadow-md transition-all placeholder-[#5f6368]"
            />
          </div>
        </div>

        {/* Right: User Profile Avatar */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white shadow-xs cursor-pointer"
            style={{ backgroundColor: currentUser.color }}
            title={`Account: ${currentUser.name}`}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* 2. Template Gallery Section */}
      <section className="bg-[#f1f3f4] border-b border-[#dadce0] py-4 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#202124]">Start a new document</h2>
            <div className="flex items-center gap-2 text-xs text-[#5f6368]">
              <button
                type="button"
                className="flex items-center gap-1 hover:bg-[#e8eaed] px-2 py-1 rounded"
              >
                <span>Template gallery</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
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
                <div className="w-full aspect-[3/4] bg-white border border-[#dadce0] rounded hover:border-[#1a73e8] transition-all overflow-hidden relative shadow-2xs group-hover:shadow-md flex flex-col justify-between p-3">
                  {tmpl.id === 'blank' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-transparent group-hover:scale-110 transition-transform">
                        <Plus className="w-10 h-10 text-[#1a73e8] stroke-[1.5]" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col">
                      <div
                        className="w-full h-2 rounded-xs mb-2"
                        style={{ backgroundColor: tmpl.thumbnailColor }}
                      />
                      <div className="space-y-1.5 opacity-60">
                        <div className="w-3/4 h-2 bg-stone-300 rounded-xs" />
                        <div className="w-full h-1.5 bg-stone-200 rounded-xs" />
                        <div className="w-5/6 h-1.5 bg-stone-200 rounded-xs" />
                        <div className="w-4/6 h-1.5 bg-stone-200 rounded-xs" />
                      </div>
                      <div className="mt-auto pt-2 border-t border-stone-100 flex items-center justify-between text-[9px] text-stone-400">
                        <span>{tmpl.category}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Title */}
                <div className="mt-2">
                  <p className="text-xs font-medium text-[#202124] group-hover:text-[#1a73e8] truncate">
                    {tmpl.name}
                  </p>
                  <p className="text-[11px] text-[#5f6368] truncate">{tmpl.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Recent Documents Section */}
      <section className="flex-1 py-6 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto">
          {/* Controls bar */}
          <div className="flex items-center justify-between mb-4 text-xs text-[#5f6368] pb-2 border-b border-[#dadce0]">
            <h2 className="text-base font-medium text-[#202124]">Recent documents</h2>

            <div className="flex items-center gap-4">
              <button
                type="button"
                className="flex items-center gap-1 hover:bg-[#f1f3f4] px-2 py-1 rounded"
              >
                <span>Owned by anyone</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <div className="flex items-center gap-1 border-l border-[#dadce0] pl-3">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded hover:bg-[#f1f3f4] ${viewMode === 'grid' ? 'text-[#1a73e8] bg-[#e8f0fe]' : ''}`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded hover:bg-[#f1f3f4] ${viewMode === 'list' ? 'text-[#1a73e8] bg-[#e8f0fe]' : ''}`}
                  title="List view"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-[#f1f3f4]"
                  title="Sort options"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => useModalStore.getState().openModal('open-file')}
                  className="p-1.5 rounded hover:bg-[#f1f3f4]"
                  title="Open file picker (Upload Word, Markdown, HTML, Text)"
                >
                  <Folder className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className="group bg-white border border-[#dadce0] hover:border-[#1a73e8] rounded-lg overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all flex flex-col"
                >
                  {/* Miniature Paper View */}
                  <div className="w-full aspect-[4/3] bg-[#fafafa] border-b border-[#dadce0] p-3 flex flex-col justify-start overflow-hidden">
                    <p className="text-[10px] text-stone-600 line-clamp-4 leading-relaxed font-sans select-none">
                      {doc.previewText || 'No text preview available. Click to open and begin writing...'}
                    </p>
                  </div>

                  {/* Document Card Footer */}
                  <div className="p-3 bg-white flex items-center justify-between relative">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 40 40" fill="none">
                        <path d="M25 4H10C8.89543 4 8 4.89543 8 6V34C8 35.1046 8.89543 36 10 36H30C31.1046 36 32 35.1046 32 34V11L25 4Z" fill="#4285F4"/>
                        <path d="M25 4L32 11H25V4Z" fill="#A1C2FA"/>
                      </svg>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#202124] truncate group-hover:text-[#1a73e8]">
                          {doc.title || 'Untitled document'}
                        </p>
                        <p className="text-[11px] text-[#5f6368]">
                          Opened {formatRelativeTime(doc.updatedAt)}
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
                        className="p-1 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuDocId === doc.id && (
                        <div
                          className="absolute right-0 bottom-full mb-1 w-40 bg-white rounded-md shadow-lg border border-[#dadce0] py-1 z-50 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectDocument(doc.id);
                              setActiveMenuDocId(null);
                            }}
                            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#f1f3f4] text-left"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#5f6368]" />
                            <span>Open</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              onDeleteDocument(doc.id, e);
                              setActiveMenuDocId(null);
                            }}
                            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#fce8e6] text-[#d93025] text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
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
            <div className="space-y-1">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#f1f3f4] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 40 40" fill="none">
                      <path d="M25 4H10C8.89543 4 8 4.89543 8 6V34C8 35.1046 8.89543 36 10 36H30C31.1046 36 32 35.1046 32 34V11L25 4Z" fill="#4285F4"/>
                      <path d="M25 4L32 11H25V4Z" fill="#A1C2FA"/>
                    </svg>
                    <span className="text-sm font-medium text-[#202124] truncate group-hover:text-[#1a73e8]">
                      {doc.title || 'Untitled document'}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-[#5f6368]">
                    <span>{formatRelativeTime(doc.updatedAt)}</span>
                    <button
                      type="button"
                      onClick={(e) => onDeleteDocument(doc.id, e)}
                      className="p-1.5 rounded-full hover:bg-[#e8eaed] text-[#5f6368] hover:text-[#d93025]"
                      title="Remove document"
                    >
                      <Trash2 className="w-4 h-4" />
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
