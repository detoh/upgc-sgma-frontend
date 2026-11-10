'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from '@/store/toast-store';
import RelanceModal from '@/components/rappels/relance-modal';

interface MembreEnRetard {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  dateAdhesion: string;
  trimestresRequis: number;
  trimestresPayes: number;
  trimestresManquants: number;
  montantDu: number;
  statut: string;
}

export default function RappelsPage() {
  const [membres, setMembres] = useState<MembreEnRetard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('En retard');
  const [search, setSearch] = useState('');
  const [showRelanceModal, setShowRelanceModal] = useState(false);
  const [membresSelectionnes, setMembresSelectionnes] = useState<MembreEnRetard[]>([]);

  const fetchMembres = async () => {
    setLoading(true);
    try {
      const response = await api.get('/membres/a-relancer', {
        params: { statut: filtreStatut },
      });
      setMembres(response.data);
    } catch (error) {
      toast.error('Erreur', 'Impossible de charger les membres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembres();
  }, [filtreStatut]);

  // Statistiques
  const totalMontantDu = membres.reduce((sum, m) => sum + m.montantDu, 0);
  const totalTrimestresManquants = membres.reduce((sum, m) => sum + m.trimestresManquants, 0);

  // Filtrer par recherche
  const membresFiltres = membres.filter((m) =>
    m.nom.toLowerCase().includes(search.toLowerCase()) ||
    m.prenom.toLowerCase().includes(search.toLowerCase()) ||
    m.matricule.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const exporterCSV = () => {
    const headers = ['Matricule', 'Nom', 'Prénom', 'Téléphone', 'Email', 'Date adhésion', 'Trimestres requis', 'Trimestres payés', 'Trimestres manquants', 'Montant dû'];
    const rows = membresFiltres.map((m) => [
      m.matricule,
      m.nom,
      m.prenom,
      m.telephone || '',
      m.email || '',
      formatDate(m.dateAdhesion),
      m.trimestresRequis,
      m.trimestresPayes,
      m.trimestresManquants,
      m.montantDu,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `membres_en_retard_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Export réussi', `${membresFiltres.length} membres exportés`);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Rappels de paiement</h1>
          <p className="text-gray-500 mt-1">Membres en retard de cotisations</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setMembresSelectionnes(membresFiltres);
              setShowRelanceModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>📧</span>
            <span>Envoyer des relances</span>
          </button>
          <button
            onClick={exporterCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span>📥</span>
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <p className="text-gray-500 text-sm">Membres en retard</p>
              <p className="text-2xl font-bold text-gray-800">{membres.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
              📅
            </div>
            <div>
              <p className="text-gray-500 text-sm">Trimestres manquants</p>
              <p className="text-2xl font-bold text-gray-800">{totalTrimestresManquants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">
              💰
            </div>
            <div>
              <p className="text-gray-500 text-sm">Montant total dû</p>
              <p className="text-2xl font-bold text-red-600">{totalMontantDu.toLocaleString()} XOF</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par statut
            </label>
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="En retard">En retard uniquement</option>
              <option value="À jour">À jour uniquement</option>
              <option value="À jour (nouveau membre)">Nouveaux membres</option>
              <option value="TOUS">Tous les membres</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, prénom ou matricule..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tableau des membres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Chargement...</div>
        ) : membresFiltres.length === 0 ? (
          <div className="text-center text-gray-500 py-12">Aucun membre trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adhésion</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Requis</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Payés</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Manquants</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant dû</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {membresFiltres.map((membre) => (
                  <tr key={membre.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{membre.matricule}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{membre.nom} {membre.prenom}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {membre.telephone && <p>📞 {membre.telephone}</p>}
                      {membre.email && <p className="text-xs">✉️ {membre.email}</p>}
                      {!membre.telephone && !membre.email && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(membre.dateAdhesion)}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium">{membre.trimestresRequis}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-green-600">{membre.trimestresPayes}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-red-600">{membre.trimestresManquants}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-red-600">
                      {membre.montantDu.toLocaleString()} XOF
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        membre.statut === 'En retard'
                          ? 'bg-red-100 text-red-800'
                          : membre.statut === 'À jour (nouveau membre)'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {membre.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modale de relance - BIEN À L'INTÉRIEUR DU JSX */}
      <RelanceModal
        isOpen={showRelanceModal}
        onClose={() => setShowRelanceModal(false)}
        membres={membresSelectionnes}
        onSuccess={fetchMembres}
      />
    </div>
  );
}