'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import NotificationBell from './notification-bell';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Tableau de bord
          </h2>
          <p className="text-sm text-gray-500">
            Bienvenue, {user?.prenom} {user?.nom}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* 👇 NOUVEAU : Cloche de notifications */}
          <NotificationBell />
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}