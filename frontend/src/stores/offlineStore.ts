import { create } from 'zustand';

interface CobroPendiente {
  id: string;
  data: Record<string, unknown>;
  token: string;
  timestamp: number;
}

interface OfflineState {
  isOnline: boolean;
  cobrosPendientes: CobroPendiente[];
  setOnline: (online: boolean) => void;
  addCobroPendiente: (cobro: Omit<CobroPendiente, 'id' | 'timestamp'>) => void;
  removeCobroPendiente: (id: string) => void;
  clearPendientes: () => void;
}

export const useOfflineStore = create<OfflineState>()((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  cobrosPendientes: [],

  setOnline: (online) => set({ isOnline: online }),

  addCobroPendiente: (cobro) =>
    set((state) => ({
      cobrosPendientes: [
        ...state.cobrosPendientes,
        { ...cobro, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    })),

  removeCobroPendiente: (id) =>
    set((state) => ({
      cobrosPendientes: state.cobrosPendientes.filter((c) => c.id !== id),
    })),

  clearPendientes: () => set({ cobrosPendientes: [] }),
}));
