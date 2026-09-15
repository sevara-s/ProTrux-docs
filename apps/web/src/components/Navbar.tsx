import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Wifi,
  WifiOff,
  Download,
  Share2,
  Check,
  RefreshCw,
  UserCheck,
  FileText,
  Code2,
  FileDown,
  ChevronDown,
} from 'lucide-react';
import { UserPresence, SyncStatus, USER_PALETTES } from '@protrux/shared';
import { Editor } from '@tiptap/react';

interface NavbarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  syncStatus: SyncStatus;
  collaborators: UserPresence[];
  currentUser: { name: string; color: string };
  onUpdateUser: (name: string, color: string) => void;
  isSimulatedOffline: boolean;
  onToggleSimulateOffline: () => void;
  onToggleSidebar: () => void;
  editor: Editor | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  onTitleChange,
  syncStatus,
  collaborators,
  currentUser,
  onUpdateUser,
  isSimulatedOffline,
  onToggleSimulateOffline,
  onToggleSidebar,
  editor,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userNameInput, setUserNameInput] = useState(currentUser.name);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleInput(title);
  }, [title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setTitleInput(title);
    }
  };

  const handleExportMarkdown = () => {
    if (!editor) return;
    const text = editor.getText();
    const blob = new Blob([`# ${title}\n\n${text}`], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `${title || 'document'}.md`);
    setShowExportMenu(false);
  };

  const handleExportHTML = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1c1917; }
    h1 { font-size: 2.2rem; margin-bottom: 0.5rem; }
    blockquote { border-left: 3px solid #6366f1; padding-left: 1rem; color: #475569; background: #f8fafc; margin: 1rem 0; }
    pre { background: #0f172a; color: #f8fafc; padding: 1rem; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, `${title || 'document'}.html`);
    setShowExportMenu(false);
  };

  const handleCopyPlainText = () => {
    if (!editor) return;
    navigator.clipboard.writeText(editor.getText());
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
    setShowExportMenu(false);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Synced</span>
          </div>
        );
      case 'syncing':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />
            <span>Merging deltas...</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300">
            <WifiOff className="w-3 h-3 text-amber-600" />
            <span>Offline (Saved to IDB)</span>
          </div>
        );
      case 'connecting':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
            <span className="w-2 h-2 rounded-full bg-stone-400" />
            <span>Connecting...</span>
          </div>
        );
    }
  };

  return (
    <header className="h-14 bg-paper-50 border-b border-stone-200 px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Left section: Sidebar toggle & Document title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 transition-colors"
          title="Toggle Documents Workspace"
        >
          <Menu className="w-5 h-5 stroke-[1.75]" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            P
          </div>
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitleInput(title);
                  setIsEditingTitle(false);
                }
              }}
              className="text-base font-semibold text-stone-900 bg-white border border-indigo-400 rounded px-2 py-0.5 outline-none ring-2 ring-indigo-100"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="text-base font-semibold text-stone-900 hover:bg-stone-100 px-2 py-0.5 rounded transition-colors text-left truncate max-w-xs md:max-w-md"
              title="Click to rename"
            >
              {title || 'Untitled Document'}
            </button>
          )}
        </div>

        {/* Sync status pill */}
        <div className="hidden sm:block">{renderSyncBadge()}</div>
      </div>

      {/* Right section: Presence, Offline Simulator, Export */}
      <div className="flex items-center gap-3">
        {/* Collaborators Avatar Cluster */}
        <div className="flex items-center -space-x-2 overflow-hidden py-1">
          {/* Current user avatar */}
          <button
            type="button"
            onClick={() => setShowUserModal(true)}
            className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white shadow-xs hover:scale-105 transition-transform"
            style={{ backgroundColor: currentUser.color }}
            title={`You: ${currentUser.name} (Click to change)`}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </button>

          {/* Remote collaborators */}
          {collaborators.map((c) => (
            <div
              key={c.id}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white shadow-xs transition-transform hover:z-20 hover:scale-110"
              style={{ backgroundColor: c.color }}
              title={`Collaborator: ${c.name}`}
            >
              {c.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>

        {/* Offline Simulation Toggle Switcher (Crucial for Video Demo!) */}
        <button
          type="button"
          onClick={onToggleSimulateOffline}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isSimulatedOffline
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-200 font-semibold'
              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:text-stone-900'
          }`}
          title="Simulate network partition to test offline CRDT merge"
        >
          {isSimulatedOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 stroke-[2]" />
              <span>Restore Network</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Simulate Offline</span>
            </>
          )}
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-50 text-stone-700 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-stone-100 text-left"
              >
                <FileText className="w-4 h-4 text-stone-500" />
                <span>Download Markdown (.md)</span>
              </button>
              <button
                type="button"
                onClick={handleExportHTML}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-stone-100 text-left"
              >
                <Code2 className="w-4 h-4 text-stone-500" />
                <span>Download HTML (.html)</span>
              </button>
              <button
                type="button"
                onClick={handleCopyPlainText}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-stone-100 text-left"
              >
                <FileDown className="w-4 h-4 text-stone-500" />
                <span>{copiedNotification ? 'Copied to Clipboard!' : 'Copy Plain Text'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User profile customize modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-stone-200">
            <h3 className="text-base font-semibold text-stone-900 mb-1">Collaborator Profile</h3>
            <p className="text-xs text-stone-500 mb-4">
              Your name and color are broadcast in real-time to peers via CRDT awareness.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={userNameInput}
                  onChange={(e) => setUserNameInput(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-2">Cursor Hue</label>
                <div className="flex flex-wrap gap-2">
                  {USER_PALETTES.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => onUpdateUser(userNameInput, p.color)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        currentUser.color === p.color ? 'ring-2 ring-offset-2 ring-stone-900 scale-110' : ''
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateUser(userNameInput.trim() || currentUser.name, currentUser.color);
                  setShowUserModal(false);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
