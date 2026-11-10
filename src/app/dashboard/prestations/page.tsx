'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import PrestationFormModal from '@/components/prestations/prestation-form-modal';
import PrestationValiderModal from '@/components/prestations/prestation-valider-modal';
import PrestationPayerModal from '@/components/prestations/prestation-payer-modal';
import PrestationDetailModal from '@/components/prestations/prestation-detail-modal';

interface Prestation {
  id: string;
  membreId: string;
  typePrestation: string;
  dateEvenement: string;
  description?: string;
  montant: number;
  statut: string;
  membre: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
  };
  beneficiaire?: {
    nom: string;
    prenom: string;
    lienParente: string;
  };
}

interface PrestationsResponse {
  data: Prestation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface Stats {
  enAttente: number;
  validees: number;
  rejetees: number;
  payees: number;
  total: number;
  montantAttente: number;
  montantValidees: number;
  montantPayees: number;
}

const TYPE_PRESTATION_LABELS: Record<string, string> = {
  NAISSANCE: 'Naissance',
  MARIAGE_MEMBRE: 'Mariage du membre',
  DECES_PERE: 'Décès du père',
  DECES_MERE: 'Décès de la mère',
  DECES_CONJOINT: 'Décès du conjoint',
  DECES_ENFANT: "Décès d'un enfant",
  DEPART_RETRAITE: 'Départ à la retraite',
  MUTATION: 'Mutation',
};

export default function PrestationsPage() {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [meta, setMeta] = useState<PrestationsResponse['meta'] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statutFilter, setStatutFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showValiderModal, setShowValiderModal] = useState(false);
  const [showPayerModal, setShowPayerModal] = useState(false);
  const [selectedPrestationId, setSelectedPrestationId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchPrestations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (statutFilter) params.append('statut', statutFilter);
      if (typeFilter) params.append('typePrestation', typeFilter);

      const response = await api.get(`/prestations?${params.toString()}`);
      setPrestations(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/prestations/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  useEffect(() => {
    fetchPrestations();
  }, [page, statutFilter, typeFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const refreshAll = () => {
    fetchPrestations();
    fetchStats();
  };

  // 👇 NOUVEAU : Fonction d'export CSV/Excel
  const exportToExcel = async () => {
    try {
      // Récupérer toutes les prestations avec les filtres actuels
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '1000'); // Limite élevée pour tout récupérer
      if (statutFilter) params.append('statut', statutFilter);
      if (typeFilter) params.append('typePrestation', typeFilter);

      const response = await api.get(`/prestations?${params.toString()}`);
      const data = response.data.data;

      if (data.length === 0) {
        alert('Aucune prestation à exporter');
        return;
      }

      // Définir les en-têtes du CSV
      const headers = [
        'Matricule',
        'Membre',
        'Type de prestation',
        'Bénéficiaire',
        'Date événement',
        'Montant (XOF)',
        'Statut',
        'Description',
      ];

      // Convertir les données en lignes CSV
      const rows = data.map((p: Prestation) => [
        p.membre.matricule,
        `${p.membre.prenom} ${p.membre.nom}`,
        TYPE_PRESTATION_LABELS[p.typePrestation] || p.typePrestation,
        p.beneficiaire ? `${p.beneficiaire.prenom} ${p.beneficiaire.nom} (${p.beneficiaire.lienParente})` : '-',
        formatDate(p.dateEvenement),
        Number(p.montant).toLocaleString('fr-FR'),
        p.statut.replace('_', ' '),
        p.description || '-',
      ]);

      // Construire le contenu CSV
      const csvContent = [
        headers.join(';'), // Séparateur point-virgule (compatible Excel FR)
        ...rows.map((row: string[]) => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')
        ),
      ].join('\n');

      // Ajouter BOM UTF-8 pour que Excel affiche correctement les accents
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Créer le lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nom du fichier avec date
      // link.download = `UPGC_prestations${filterStr}_${dateStr}.csv`;
      const dateStr = new Date().toISOString().split('T')[0];
      const filterStr = statutFilter ? `_${statutFilter}` : '';
      link.download = `UPGC_prestations${filterStr}_${dateStr}.csv`;
      
      
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export. Veuillez réessayer.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getStatutBadge = (statut: string) => {
    const styles = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      VALIDEE: 'bg-blue-100 text-blue-800',
      REJETEE: 'bg-red-100 text-red-800',
      PAYEE: 'bg-green-100 text-green-800',
    };
    return styles[statut as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const formatMontant = (montant: number | bigint) => {
    return Number(montant).toLocaleString('fr-FR');
  };

  // Onglets rapides
  const tabs = [
    { label: 'Tous', value: '', count: stats?.total || 0, color: 'gray' },
    { label: 'En attente', value: 'EN_ATTENTE', count: stats?.enAttente || 0, color: 'yellow' },
    { label: 'Validées', value: 'VALIDEE', count: stats?.validees || 0, color: 'blue' },
    { label: 'Payées', value: 'PAYEE', count: stats?.payees || 0, color: 'green' },
    { label: 'Rejetées', value: 'REJETEE', count: stats?.rejetees || 0, color: 'red' },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Prestations</h1>
          <p className="text-gray-500 mt-1">
            Gérez les demandes de prestations sociales
          </p>
        </div>
        <div className="flex space-x-3">
          {/* 👇 NOUVEAU : Bouton Export */}
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            title="Exporter la liste en Excel/CSV"
          >
            <span>📥</span>
            <span>Exporter Excel</span>
          </button>
          
          {/* Bouton Nouvelle demande */}
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Nouvelle demande</span>
          </button>
        </div>
      </div>

      {/* 🎯 NOUVEAU : Cards de statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* En attente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">En attente</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.enAttente}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatMontant(stats.montantAttente)} XOF
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          {/* Validées */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Validées</p>
                <p className="text-3xl font-bold text-blue-600">{stats.validees}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatMontant(stats.montantValidees)} XOF
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          {/* Payées */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Payées</p>
                <p className="text-3xl font-bold text-green-600">{stats.payees}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatMontant(stats.montantPayees)} XOF
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          {/* Rejetées */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Rejetées</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejetees}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Total : {stats.total} prestations
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 NOUVEAU : Onglets rapides */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatutFilter(tab.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                statutFilter === tab.value
                  ? `bg-${tab.color}-100 text-${tab.color}-800 border-2 border-${tab.color}-300`
                  : 'text-gray-600 hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                statutFilter === tab.value
                  ? `bg-${tab.color}-200 text-${tab.color}-900`
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtres détaillés */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Filtre par type */}
          <div className="flex-1">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Tous les types de prestation</option>
              {Object.entries(TYPE_PRESTATION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton réinitialiser */}
          {(statutFilter || typeFilter) && (
            <button
              onClick={() => {
                setStatutFilter('');
                setTypeFilter('');
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              🔄 Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Table des prestations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date événement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : prestations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Aucune prestation trouvée
                  </td>
                </tr>
              ) : (
                prestations.map((prestation) => (
                  <tr key={prestation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {prestation.membre.prenom} {prestation.membre.nom}
                      </div>
                      <div className="text-sm text-gray-500">
                        {prestation.membre.matricule}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {TYPE_PRESTATION_LABELS[prestation.typePrestation] || prestation.typePrestation}
                      {prestation.beneficiaire && (
                        <div className="text-xs text-gray-500">
                          Bénéficiaire: {prestation.beneficiaire.prenom} {prestation.beneficiaire.nom}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(prestation.dateEvenement)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {Number(prestation.montant).toLocaleString()} XOF
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatutBadge(prestation.statut)}`}
                      >
                        {prestation.statut.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Bouton Voir détails (toujours visible) */}
                        <button
                          onClick={() => {
                            setSelectedPrestationId(prestation.id);
                            setShowDetailModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                          title="Voir les détails"
                        >
                          👁️ Détails
                        </button>
                        
                        {prestation.statut === 'EN_ATTENTE' && (
                          <button
                            onClick={() => {
                              setSelectedPrestationId(prestation.id);
                              setShowValiderModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Valider / Rejeter
                          </button>
                        )}
                        {prestation.statut === 'VALIDEE' && (
                          <button
                            onClick={() => {
                              setSelectedPrestationId(prestation.id);
                              setShowPayerModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Payer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {meta.page} sur {meta.totalPages} ({meta.total} prestations)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <PrestationFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={refreshAll}
      />
      <PrestationValiderModal
        isOpen={showValiderModal}
        onClose={() => setShowValiderModal(false)}
        onSuccess={refreshAll}
        prestationId={selectedPrestationId}
      />
      <PrestationPayerModal
        isOpen={showPayerModal}
        onClose={() => setShowPayerModal(false)}
        onSuccess={refreshAll}
        prestationId={selectedPrestationId}
      />
      <PrestationDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        prestationId={selectedPrestationId}
        onAction={refreshAll}
      />
    </div>
  );
}