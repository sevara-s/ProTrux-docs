import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, Search, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useModal } from '@/store/modal-store';
import { useDocumentStore } from '@/store/document-store';
import { useDocuments } from '@/hooks/useDocuments';
import mammoth from 'mammoth';

interface OpenFileModalProps {
  onOpenDocument: (id: string) => void;
  onImportContent: (title: string, content: string) => void;
}

export const OpenFileModal: React.FC<OpenFileModalProps> = ({
  onOpenDocument,
  onImportContent,
}) => {
  const { isOpen, closeModal } = useModal('open-file');
  const documents = useDocumentStore((state) => state.documents);
  const { create } = useDocuments();

  const [activeTab, setActiveTab] = useState<'recent' | 'upload'>('upload');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage(`Reading ${file.name}...`);

    const extension = file.name.split('.').pop()?.toLowerCase();
    const rawTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

    try {
      let content = '';

      if (extension === 'docx') {
        setStatusMessage('Converting Word (.docx) document...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        content = result.value;
      } else if (extension === 'html' || extension === 'htm') {
        content = await file.text();
      } else if (extension === 'md' || extension === 'markdown') {
        const text = await file.text();
        // Wrap basic markdown lines in html tags
        content = text
          .split('\n')
          .map((line) => {
            if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
            if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
            if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
            if (line.trim().length === 0) return '<p></p>';
            return `<p>${line}</p>`;
          })
          .join('');
      } else {
        // Plain text or fallback
        const text = await file.text();
        content = text
          .split('\n')
          .map((p) => `<p>${p || '&nbsp;'}</p>`)
          .join('');
      }

      setStatusMessage('Creating collaborative document...');
      closeModal();
      onImportContent(title, content);
    } catch (err: any) {
      console.error('Error importing file:', err);
      setStatusMessage(`Error: ${err?.message || 'Could not parse document'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full flex flex-col h-[520px] border border-[#dadce0] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#dadce0]">
          <h3 className="text-lg font-medium text-[#202124]">Open a file</h3>
          <button
            type="button"
            onClick={closeModal}
            className="p-1 text-[#5f6368] hover:text-[#202124] rounded-full hover:bg-[#f1f3f4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#dadce0] px-6 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-[#1a73e8] text-[#1a73e8]'
                : 'border-transparent text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recent')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'recent'
                ? 'border-[#1a73e8] text-[#1a73e8]'
                : 'border-transparent text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            Recent
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center transition-all ${
                isDragging
                  ? 'border-[#1a73e8] bg-[#e8f0fe]'
                  : 'border-[#dadce0] bg-[#fafafa] hover:bg-[#f8fafd]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.txt,.md,.markdown,.html,.htm"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h4 className="text-base font-medium text-[#202124] mb-1">
                Drag a file here
              </h4>
              <p className="text-xs text-[#5f6368] mb-5">
                Supported: <strong>Word (.docx)</strong>, <strong>Markdown (.md)</strong>, <strong>HTML (.html)</strong>, <strong>Text (.txt)</strong>
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-lg text-sm font-medium transition-colors shadow-xs disabled:opacity-50"
              >
                {isProcessing ? 'Processing file...' : 'Browse your computer'}
              </button>

              {statusMessage && (
                <p className="mt-4 text-xs font-medium text-[#1a73e8] animate-pulse">
                  {statusMessage}
                </p>
              )}
            </div>
          ) : (
            /* Recent Documents Tab */
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#5f6368]" />
                <input
                  type="text"
                  placeholder="Search recent files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-[#dadce0] rounded-lg text-sm focus:outline-none focus:border-[#1a73e8]"
                />
              </div>

              <div className="space-y-1 mt-2">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      onOpenDocument(doc.id);
                      closeModal();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#f1f3f4] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-[#1a73e8] shrink-0" />
                      <span className="text-sm font-medium text-[#202124] truncate">
                        {doc.title || 'Untitled document'}
                      </span>
                    </div>
                    <span className="text-xs text-[#5f6368]">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
