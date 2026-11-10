'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';

const menuItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: '📊', roles: ['ADMIN', 'GESTIONNAIRE', 'CAISSIER', 'MEMBRE'] },
  { href: '/dashboard/membres', label: 'Membres', icon: '👥', roles: ['ADMIN', 'GESTIONNAIRE', 'CAISSIER', 'MEMBRE'] },
  { href: '/dashboard/cotisations', label: 'Cotisations', icon: '💰', roles: ['ADMIN', 'GESTIONNAIRE', 'CAISSIER'] },
  { href: '/dashboard/rappels', label: 'Rappels', icon: '🔔', roles: ['ADMIN', 'GESTIONNAIRE', 'CAISSIER'], badgeKey: 'rappels' },
  { href: '/dashboard/prestations', label: 'Prestations', icon: '🏥', roles: ['ADMIN', 'GESTIONNAIRE', 'MEMBRE'], badgeKey: 'prestations' },
  { href: '/dashboard/activites', label: 'Activités', icon: '📈', roles: ['ADMIN', 'GESTIONNAIRE'] },
  { href: '/dashboard/dons', label: 'Dons', icon: '💝', roles: ['ADMIN', 'GESTIONNAIRE', 'CAISSIER'] },
  { href: '/dashboard/rapports', label: 'Rapports', icon: '📋', roles: ['ADMIN', 'GESTIONNAIRE'] },
  { href: '/dashboard/rapports/etats-paiements', label: 'État Paiements', icon: '📄', roles: ['ADMIN', 'GESTIONNAIRE'] },
  { href: '/dashboard/utilisateurs', label: 'Utilisateurs', icon: '👤', roles: ['ADMIN'] },
  { href: '/dashboard/profil', label: 'Mon profil', icon: '👤', roles: ['ADMIN', 'GESTIONNAIRE', 'CAISSIER', 'MEMBRE'] },
  { href: '/dashboard/parametres', label: 'Paramètres', icon: '⚙️', roles: ['ADMIN'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  
  // 👇 État pour les compteurs de badges
  const [counters, setCounters] = useState({
    rappels: 0,
    prestations: 0,
  });

  // 👇 Récupérer les compteurs
  useEffect(() => {
    const fetchCounters = async () => {
      try {
        // Appel parallèle pour plus de rapidité
        const [rappelsRes, prestationsRes] = await Promise.all([
          api.get('/membres/a-relancer', { params: { statut: 'En retard' } }),
          api.get('/prestations/stats'),
        ]);

        setCounters({
          rappels: rappelsRes.data.length || 0,
          prestations: prestationsRes.data.enAttente || 0,
        });
      } catch (error) {
        console.error('Erreur chargement compteurs:', error);
      }
    };

    fetchCounters();
    
    // Actualiser toutes les 60 secondes
    const interval = setInterval(fetchCounters, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // 👉 Filtre robuste : si user null, on ne montre rien
  const filteredMenuItems = menuItems.filter(item => {
    if (!user?.role) return false;
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  });

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">U</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-800">MUDP-UPGC</h1>
            <p className="text-xs text-gray-500">Systeme Gestion des Mutuelles et Associations</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          // Récupérer le compteur pour cet item (s'il en a un)
          const badgeCount = item.badgeKey ? counters[item.badgeKey as keyof typeof counters] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              
              {/* 👇 Badge rouge si compteur > 0 */}
              {badgeCount > 0 && (
                <span 
                  className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full min-w-[24px] text-center animate-pulse cursor-pointer"
                  title={`${badgeCount} élément(s) nécessitant une action`}
                >
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Infos utilisateur */}
      {user && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {user.prenom?.[0]}{user.nom?.[0]}
              </span>
            </div>
              <Link href="/dashboard/profil" className="flex-1 min-w-0 hover:bg-gray-50 rounded-lg p-1 transition-colors">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </Link>
          </div>
        </div>
      )}
    </aside>
  );
}