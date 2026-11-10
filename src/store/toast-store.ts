import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  // Méthodes raccourcies
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration || 4000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Suppression automatique après duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Méthodes raccourcies
  success: (title, message) =>
    set((state) => {
      const id = Math.random().toString(36).substring(2, 9);
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 4000);
      return { toasts: [...state.toasts, { id, type: 'success', title, message }] };
    }),

  error: (title, message) =>
    set((state) => {
      const id = Math.random().toString(36).substring(2, 9);
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 5000);
      return { toasts: [...state.toasts, { id, type: 'error', title, message }] };
    }),

  warning: (title, message) =>
    set((state) => {
      const id = Math.random().toString(36).substring(2, 9);
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 4500);
      return { toasts: [...state.toasts, { id, type: 'warning', title, message }] };
    }),

  info: (title, message) =>
    set((state) => {
      const id = Math.random().toString(36).substring(2, 9);
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 4000);
      return { toasts: [...state.toasts, { id, type: 'info', title, message }] };
    }),
}));

// Hook raccourci pour utilisation facile
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().success(title, message),
  error: (title: string, message?: string) =>
    useToastStore.getState().error(title, message),
  warning: (title: string, message?: string) =>
    useToastStore.getState().warning(title, message),
  info: (title: string, message?: string) =>
    useToastStore.getState().info(title, message),
};