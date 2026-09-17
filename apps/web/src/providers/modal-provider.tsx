import React from 'react';
import { useModal } from '@/store/modal-store';
import { useDocumentStore } from '@/store/document-store';
import { useUserStore } from '@/store/user-store';
import { ShareModal } from '@/components/ShareModal';
import { WordCountModal } from '@/components/WordCountModal';

interface ModalProviderProps {
  stats: {
    words: number;
    chars: number;
    charsNoSpaces: number;
    pages: number;
  };
  displayLiveWordCount: boolean;
  onToggleDisplayLiveWordCount: (val: boolean) => void;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({
  stats,
  displayLiveWordCount,
  onToggleDisplayLiveWordCount,
}) => {
  const shareModal = useModal('share');
  const wordCountModal = useModal('word-count');

  const currentDocTitle = useDocumentStore((state) => state.currentDocTitle);
  const currentDocId = useDocumentStore((state) => state.currentDocId);
  const currentUser = useUserStore((state) => state.currentUser);
  const collaborators = useUserStore((state) => state.collaborators);

  return (
    <>
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={shareModal.closeModal}
        documentTitle={currentDocTitle}
        documentId={currentDocId}
        collaborators={collaborators}
        currentUser={currentUser}
      />

      <WordCountModal
        isOpen={wordCountModal.isOpen}
        onClose={wordCountModal.closeModal}
        words={stats.words}
        chars={stats.chars}
        charsNoSpaces={stats.charsNoSpaces}
        pages={stats.pages}
        displayLive={displayLiveWordCount}
        onToggleDisplayLive={onToggleDisplayLiveWordCount}
      />
    </>
  );
};
