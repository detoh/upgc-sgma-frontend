'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from '@/store/toast-store';
import { useRouter } from 'next/navigation';        
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import {
  GraphiqueRepartition,
  GraphiqueEncaissements,
  GraphiqueTop10Retard,
  GraphiqueRepartitionCotisations,
} from '@/components/dashboard/charts';
interface DashboardData {
  totalMembres: number;
  membresActifs: number;
  membresSuspendus: number;
  membresRadie: number;
  membresAJour: number;
  membresEnRetard: number;
  totalMontantDu: number;
  top10EnRetard: Array<{
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
    trimestresManquants: number;
    montantDu: number;
  }>;
  encaissements: Array<{ mois: string; montant: number }>;
  repartitionCotisations: Array<{ nom: string; total: number; nombre: number }>;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'MEMBRE') {
      router.replace('/dashboard/mon-espace');
      return;
    }
  }, [user, router]);

  

  const fetchDashboardData = async () => {
    if (user?.role === 'MEMBRE') return;
    setLoading(true);
    try {
      const response = await api.get('/dashboard/resume');
      const raw = response.data;

      const dashboardData: DashboardData = {
        totalMembres: raw.totalMembres || 0,
        membresActifs: raw.membresActifs || 0,
        membresSuspendus: raw.membresSuspendus || 0,
        membresRadie: raw.membresRadie || 0,
        membresAJour: raw.membresAJour || 0,
        membresEnRetard: raw.membresEnRetard || 0,
        totalMontantDu: raw.totalMontantDu || 0,
        top10EnRetard: raw.top10EnRetard || [],
        encaissements: raw.encaissements || [],
        repartitionCotisations: raw.repartitionCotisations || [],
      };

      setData(dashboardData);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur', 'Impossible de charger les données du dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement du dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Erreur de chargement</div>
      </div>
    );
  }

  const tauxAJour = data.totalMembres > 0
    ? Math.round((data.membresAJour / data.totalMembres) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble de la mutuelle</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total membres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total membres</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{data.totalMembres}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600">● {data.membresActifs} actifs</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-red-600">● {data.membresRadie} radiés</span>
          </div>
        </div>

        {/* À jour */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Membres à jour</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{data.membresAJour}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, tauxAJour))}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">{tauxAJour}% des membres</p>
          </div>
        </div>

        {/* En retard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Membres en retard</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{data.membresEnRetard}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600 font-semibold">
              {(data.totalMontantDu || 0).toLocaleString()} XOF à recouvrer
            </span>
          </div>
        </div>

        {/* Lien rapide vers rappels */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Actions rapides</p>
              <p className="text-xl font-bold mt-1">Relances</p>
            </div>
            <div className="text-4xl">🔔</div>
          </div>
          <Link
            href="/dashboard/rappels"
            className="mt-4 inline-block px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
          >
            Gérer les relances →
          </Link>
        </div>
      </div>

      {/* Graphiques - Ligne 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camembert : À jour / En retard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📊 Situation des cotisations
          </h3>
          <GraphiqueRepartition
            membresAJour={data.membresAJour}
            membresEnRetard={data.membresEnRetard}
          />
        </div>

        {/* Barres : Encaissements par mois */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            💰 Encaissements (6 derniers mois)
          </h3>
          <GraphiqueEncaissements data={data.encaissements} />
        </div>
      </div>

      {/* Graphiques - Ligne 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 en retard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🏆 Top 10 des membres en retard
          </h3>
          {data.top10EnRetard.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun membre en retard 🎉</p>
          ) : (
            <GraphiqueTop10Retard data={data.top10EnRetard} />
          )}
        </div>

        {/* Répartition des cotisations par type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📈 Répartition des cotisations
          </h3>
          <GraphiqueRepartitionCotisations data={data.repartitionCotisations} />
        </div>
      </div>

      {/* Tableau : Top 10 en retard (détails) */}
      {data.top10EnRetard.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Détails des membres en retard
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom complet</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trimestres manquants</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant dû</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.top10EnRetard.map((membre) => (
                  <tr key={membre.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{membre.matricule}</td>
                    <td className="px-4 py-3 text-sm">{membre.prenom} {membre.nom}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        {membre.trimestresManquants} trim.
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600">
                      {(membre.montantDu || 0).toLocaleString()} XOF
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}