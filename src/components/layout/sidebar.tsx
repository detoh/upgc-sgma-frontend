'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: number;
}

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [counters, setCounters] = useState({ rappels: 0, prestations: 0 });

  useEffect(() => {
    const fetchCounters = async () => {
      const currentRole = useAuthStore.getState().user?.role;
      console.log("👀 [DEBUG SIDEBAR] Rôle détecté:", currentRole);
      
      if (!currentRole || currentRole === 'MEMBRE') {
        console.log("🛑 [DEBUG SIDEBAR] BLOQUÉ (MEMBRE ou null). Aucun appel API.");
        return;
      }

      console.log("🟢 [DEBUG SIDEBAR] AUTORISÉ. Chargement des compteurs...");
      try {
        const [rappelsRes, prestationsRes] = await Promise.all([
          api.get('/membres/a-relancer', { params: { statut: 'En retard' } }),
          api.get('/prestations/stats'),
        ]);
        setCounters({
          rappels: rappelsRes.data.length || 0,
          prestations: prestationsRes.data.enAttente || 0,
        });
      } catch (error) {
        console.error("❌ [DEBUG SIDEBAR] Erreur API:", error);
      }
    };

    fetchCounters();
    const interval = setInterval(fetchCounters, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems: MenuItem[] = [
    {
      label: 'Tableau de bord',
      href: '/dashboard',
      icon: <span>📊</span>,
      roles: ['ADMIN', 'GESTIONNAIRE', 'CAISSIER'],
    },
    {
      label: 'Membres',
      href: '/dashboard/membres',
      icon: <span>👥</span>,
      roles: ['ADMIN', 'GESTIONNAIRE', 'CAISSIER'],
    },
    {
      label: 'Cotisations',
      href: '/dashboard/cotisations',
      icon: <span>💰</span>,
      roles: ['ADMIN', 'GESTIONNAIRE', 'CAISSIER'],
    },
    {
      label: 'Rappels',
      href: '/dashboard/rappels',
      icon: <span>🔔</span>,
      roles: ['ADMIN', 'GESTIONNAIRE', 'CAISSIER'],
      badge: counters.rappels,
    },
    {
      label: 'Prestations',
      href: '/dashboard/prestations',
      icon: <span>🏥</span>,
      roles: ['ADMIN', 'GESTIONNAIRE'],
      badge: counters.prestations,
    },
    {
      label: 'Activités',
      href: '/dashboard/activites',
      icon: <span>📅</span>,
      roles: ['ADMIN', 'GESTIONNAIRE'],
    },
    {
      label: 'Dons',
      href: '/dashboard/dons',
      icon: <span>🎁</span>,
      roles: ['ADMIN', 'GESTIONNAIRE', 'CAISSIER'],
    },
    {
      label: 'Rapports',
      href: '/dashboard/rapports',
      icon: <span>📈</span>,
      roles: ['ADMIN', 'GESTIONNAIRE'],
    },
    {
      label: 'Utilisateurs',
      href: '/dashboard/utilisateurs',
      icon: <span>👤</span>,
      roles: ['ADMIN'],
    },
    {
      label: 'Paramètres',
      href: '/dashboard/parametres',
      icon: <span>⚙️</span>,
      roles: ['ADMIN'],
    },
    {
      label: 'Mon Espace',
      href: '/dashboard/mon-espace',
      icon: <span>🏠</span>,
      roles: ['MEMBRE'],
    },
    {
      label: 'Mon Profil',
      href: '/dashboard/profil',
      icon: <span>👤</span>,
      roles: ['MEMBRE'],
    },
  ];

  const filteredItems = menuItems.filter(
    (item) =>
      !item.roles ||
      (user && (user.role === 'SUPER_ADMIN' || item.roles.includes(user.role)))
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-blue-600">SGMA</h2>
        <p className="text-sm text-gray-500">{user?.role}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </span>
              {item.badge && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
        >
          <span>🚪</span>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}