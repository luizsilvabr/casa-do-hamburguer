import { create } from "zustand";

// Aviso rápido ("Adicionado ao carrinho"). O `id` muda a cada aviso: mesmo com
// a mesma mensagem, o contador de auto-fechar reinicia.
interface ToastState {
  message: string | null;
  id: number;
  show: (message: string) => void;
  hide: () => void;
}

export const useSiteToastStore = create<ToastState>((set) => ({
  message: null,
  id: 0,
  show: (message) => set((state) => ({ message, id: state.id + 1 })),
  hide: () => set({ message: null }),
}));
