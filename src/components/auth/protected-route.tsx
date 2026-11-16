'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

const roleRoutes: Record<string, string[]> = {
  MEMBRE: ['/dashboard/mon-espace', '/dashboard/profil'],
  CAISSIER: ['/dashboard', '/dashboard/membres', '/dashboard/cotisations', '/dashboard/rappels', '/dashboard/dons', '/dashboard/profil'],
  GESTIONNAIRE: ['/dashboard', '/dashboard/membres', '/dashboard/cotisations', '/dashboard/rappels', '/dashboard/prestations', '/dashboard/activites', '/dashboard/dons', '/dashboard/rapports', '/dashboard/rapports/etats-paiements', '/dashboard/profil'],
  ADMIN: ['/dashboard', '/dashboard/membres', '/dashboard/cotisations', '/dashboard/rappels', '/dashboard/prestations', '/dashboard/activites', '/dashboard/dons', '/dashboard/rapports', '/dashboard/rapports/etats-paiements', '/dashboard/utilisateurs', '/dashboard/parametres', '/dashboard/profil'],
};

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  // 🆕 Astuce pour éviter l'erreur d'hydratation
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Ne faire les vérifications de redirection qu'après le montage côté client
    if (!isMounted) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const allowed = roleRoutes[user.role] || [];
    const isAllowed = allowed.some((r) => pathname === r || pathname.startsWith(r + '/'));

    if (!isAllowed) {
      const home = user.role === 'MEMBRE' ? '/dashboard/mon-espace' : '/dashboard';
      router.replace(home);
    }
  }, [user, pathname, router, isMounted]);

  // 🆕 Pendant le rendu serveur et le tout premier rendu client, on affiche un chargement cohérent
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500 font-medium">Chargement de l'espace sécurisé...</div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}