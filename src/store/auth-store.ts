import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, motDePasse: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

// Fonctions helper pour localStorage (sécurisées pour SSR)
const getStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignorer les erreurs
  }
};

const removeStorageItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignorer les erreurs
  }
};

// Récupérer l'utilisateur sauvegardé (si existe)
const getSavedUser = (): User | null => {
  const savedUser = getStorageItem('user');
  if (!savedUser) return null;
  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  // 👇 Charger user ET token depuis localStorage au démarrage
  user: getSavedUser(),
  token: getStorageItem('access_token'),
  isLoading: false,

  login: async (email: string, motDePasse: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login', { email, motDePasse });
      const { user, access_token } = response.data;
      
      // 👇 Sauvegarder les deux dans localStorage
      setStorageItem('access_token', access_token);
      setStorageItem('user', JSON.stringify(user));
      
      set({ user, token: access_token, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(
        error.response?.data?.message || 'Erreur de connexion'
      );
    }
  },

  logout: () => {
    // 👇 Supprimer les deux du localStorage
    removeStorageItem('access_token');
    removeStorageItem('user');
    set({ user: null, token: null });
  },

  setUser: (user) => {
    if (user) {
      setStorageItem('user', JSON.stringify(user));
    } else {
      removeStorageItem('user');
    }
    set({ user });
  },
}));