'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
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
  }, [user, pathname, router]);

  if (!user) return null;

  return <>{children}</>;
}