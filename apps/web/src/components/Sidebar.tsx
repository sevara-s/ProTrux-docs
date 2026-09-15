import React, { useState } from 'react';
import {
  Plus,
  Search,
  FileText,
  Trash2,
  X,
  Users,
  Clock,
  Sparkles,
  Database,
  ExternalLink,
} from 'lucide-react';
import { DocumentMetadata } from '@protrux/shared';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentMetadata[];
  currentDocId: string;
  onSelectDoc: (id: string) => void;
  onCreateDoc: () => void;
  onDeleteDoc: (id: string, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  documents,
  currentDocId,
  onSelectDoc,
  onCreateDoc,
  onDeleteDoc,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-stone-900 text-stone-200 z-40 flex flex-col transition-transform duration-200 ease-in-out border-r border-stone-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-100 tracking-tight">ProTrux Docs</h2>
              <p className="text-[10px] text-stone-400 font-mono">CRDT Local-First</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-100 hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button: Create New Document */}
        <div className="p-3">
          <button
            type="button"
            onClick={onCreateDoc}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Document</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-stone-800/80 border border-stone-700/80 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Documents Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            Workspace Documents ({filteredDocs.length})
          </div>

          {filteredDocs.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-stone-500">
              No matching documents
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = doc.id === currentDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDoc(doc.id)}
                  className={`group relative flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-stone-800 text-stone-100 font-medium shadow-xs border border-stone-700/60'
                      : 'text-stone-300 hover:bg-stone-800/50 hover:text-stone-100'
                  }`}
                >
                  <FileText
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isSelected ? 'text-indigo-400' : 'text-stone-500 group-hover:text-stone-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs truncate leading-snug">{doc.title || 'Untitled Document'}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-500" />
                        {formatRelativeTime(doc.updatedAt)}
                      </span>
                      {doc.activeUsersCount !== undefined && doc.activeUsersCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <Users className="w-3 h-3" />
                          {doc.activeUsersCount} online
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button (hover) */}
                  <button
                    type="button"
                    onClick={(e) => onDeleteDoc(doc.id, e)}
                    className="absolute right-2 top-2.5 p-1 rounded text-stone-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-stone-700/80 transition-all"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info: Local-First Engine */}
        <div className="p-3 border-t border-stone-800 text-[11px] text-stone-400 space-y-1.5 bg-stone-950/40">
          <div className="flex items-center justify-between text-stone-400">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>IndexedDB Cache</span>
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">ACTIVE</span>
          </div>
          <p className="text-[10px] text-stone-500 leading-tight">
            Every keystroke is transactionally recorded locally for zero-loss offline resilience.
          </p>
        </div>
      </aside>
    </>
  );
};
