import { create } from 'zustand';

export type DialogMode = 'confirm' | 'prompt' | 'alert';

export interface DialogOptions {
  mode?: DialogMode;
  title: string;
  message?: string;
  /** Prefilled value for prompt mode */
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Emphasize destructive confirm (trash, etc.) */
  danger?: boolean;
  inputType?: 'text' | 'url';
}

interface DialogState extends DialogOptions {
  open: boolean;
  inputValue: string;
  resolve: ((value: boolean | string | null) => void) | null;
  openDialog: (options: DialogOptions) => Promise<boolean | string | null>;
  setInputValue: (value: string) => void;
  confirm: () => void;
  cancel: () => void;
}

const defaults: Omit<DialogState, 'openDialog' | 'setInputValue' | 'confirm' | 'cancel'> = {
  open: false,
  mode: 'confirm',
  title: '',
  message: '',
  defaultValue: '',
  placeholder: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
  inputType: 'text',
  inputValue: '',
  resolve: null,
};

export const useDialogStore = create<DialogState>((set, get) => ({
  ...defaults,

  openDialog: (options) =>
    new Promise((resolve) => {
      // Resolve any previous dialog as cancelled
      const prev = get().resolve;
      if (prev) prev(null);

      set({
        open: true,
        mode: options.mode ?? 'confirm',
        title: options.title,
        message: options.message ?? '',
        defaultValue: options.defaultValue ?? '',
        placeholder: options.placeholder ?? '',
        confirmLabel:
          options.confirmLabel ??
          (options.mode === 'prompt' ? 'Insert' : options.mode === 'alert' ? 'OK' : 'Confirm'),
        cancelLabel: options.cancelLabel ?? 'Cancel',
        danger: Boolean(options.danger),
        inputType: options.inputType ?? 'text',
        inputValue: options.defaultValue ?? '',
        resolve,
      });
    }),

  setInputValue: (inputValue) => set({ inputValue }),

  confirm: () => {
    const { mode, inputValue, resolve } = get();
    if (mode === 'prompt') {
      const trimmed = inputValue.trim();
      resolve?.(trimmed.length ? trimmed : null);
    } else if (mode === 'alert') {
      resolve?.(true);
    } else {
      resolve?.(true);
    }
    set({ ...defaults });
  },

  cancel: () => {
    const { mode, resolve } = get();
    resolve?.(mode === 'confirm' ? false : null);
    set({ ...defaults });
  },
}));

/** Confirm → Promise<boolean> */
export function confirmDialog(options: Omit<DialogOptions, 'mode'>): Promise<boolean> {
  return useDialogStore.getState().openDialog({ ...options, mode: 'confirm' }) as Promise<boolean>;
}

/** Prompt → Promise<string | null> (null if cancelled / empty) */
export function promptDialog(
  options: Omit<DialogOptions, 'mode'>
): Promise<string | null> {
  return useDialogStore.getState().openDialog({ ...options, mode: 'prompt' }) as Promise<
    string | null
  >;
}

/** Alert → Promise<void> */
export async function alertDialog(options: Omit<DialogOptions, 'mode'>): Promise<void> {
  await useDialogStore.getState().openDialog({ ...options, mode: 'alert' });
}
