import { create } from 'zustand';

interface ModalState {
  modals: Record<string, boolean>;
  openModal: (key: string) => void;
  closeModal: (key: string) => void;
  toggleModal: (key: string) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modals: {},
  openModal: (key: string) =>
    set((state) => ({ modals: { ...state.modals, [key]: true } })),
  closeModal: (key: string) =>
    set((state) => ({ modals: { ...state.modals, [key]: false } })),
  toggleModal: (key: string) =>
    set((state) => ({ modals: { ...state.modals, [key]: !state.modals[key] } })),
}));

export function useModal(modalKey: string = 'default') {
  const isOpen = useModalStore((state) => Boolean(state.modals[modalKey]));
  const open = useModalStore((state) => state.openModal);
  const close = useModalStore((state) => state.closeModal);
  const toggle = useModalStore((state) => state.toggleModal);

  return {
    isOpen,
    openModal: () => open(modalKey),
    closeModal: () => close(modalKey),
    toggleModal: () => toggle(modalKey),
  };
}
