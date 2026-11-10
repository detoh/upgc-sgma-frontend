'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import MembreFormModal from '@/components/membres/membre-form-modal';
import MembreEditModal from '@/components/membres/membre-edit-modal';
import MembreDetailModal from '@/components/membres/membre-detail-modal';
import { toast } from '@/store/toast-store';
import MemberCardModal from '@/components/membres/member-card-modal';
import AttestationAdhesionModal from '@/components/membres/attestation-adhesion-modal';
import ImportMembresModal from '@/components/membres/import-membres-modal';
interface Membre {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  profession?: string;
  telephone?: string;
  email?: string;
  dateAdhesion: string;
  statut: string;
  cotisations?: any[];
}

interface MembresResponse {
  data: Membre[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function MembresPage() {
  // États principaux
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres et recherche
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembres, setTotalMembres] = useState(0);
  const limit = 20;
  
  // Modales
  const [showForm, setShowForm] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMembreId, setSelectedMembreId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardMembre, setCardMembre] = useState<Membre | null>(null);
  const [showAttestationModal, setShowAttestationModal] = useState(false);
  const [attestationMembre, setAttestationMembre] = useState<Membre | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchMembres = async () => {
    setLoading(true);
    try {
      // Construire les paramètres dynamiquement (ne jamais envoyer de chaînes vides)
      const params: any = {
        page,
        limit
      };
      
      // N'ajouter search que s'il n'est pas vide
      if (search && search.trim() !== '') {
        params.search = search;
      }
      
      // N'ajouter statut que s'il n'est pas vide
      if (statutFilter && statutFilter.trim() !== '') {
        params.statut = statutFilter;
      }

      const response = await api.get('/membres', { params });

      if (response.data.meta) {
        setMembres(response.data.data);
        setTotalPages(response.data.meta.totalPages);
        setTotalMembres(response.data.meta.total);
      } else {
        const dataArray = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setMembres(dataArray);
      }
    } catch (error: any) {
      console.error('Erreur fetchMembres:', error);
      toast.error('Erreur', 'Impossible de charger les membres');
    } finally {
      setLoading(false);
    }
  };

  // Recharger quand la page ou les filtres changent
  useEffect(() => {
    fetchMembres();
  }, [statutFilter, page]);

  // Remettre à la page 1 quand on change un filtre
  useEffect(() => {
    setPage(1);
  }, [statutFilter]);

  // Recherche avec debounce (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchMembres();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getStatutBadge = (statut: string) => {
    const styles = {
      ACTIF: 'bg-green-100 text-green-800',
      SUSPENDU: 'bg-yellow-100 text-yellow-800',
      RADIE: 'bg-red-100 text-red-800',
    };
    return styles[statut as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };
  // ==========================================
  // CALCULER LE STATUT DES COTISATIONS D'UN MEMBRE
  // ==========================================
  const calculerStatutCotisations = (membre: Membre) => {
    // Vérifier que le membre a des cotisations
    if (!membre.cotisations || membre.cotisations.length === 0) {
      return {
        estAJour: false,
        statut: 'En retard',
        trimestresManquants: 0,
        montantDu: 0,
        totalPaye: 0,
      };
    }

    const now = new Date();
    const dateAdhesion = new Date(membre.dateAdhesion);

    // Calculer le nombre de trimestres requis
    const trimestreActuel = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3) + 1;
    const trimestreAdhesion = dateAdhesion.getFullYear() * 4 + Math.floor(dateAdhesion.getMonth() / 3) + 1;
    const trimestresRequis = Math.max(0, trimestreActuel - trimestreAdhesion);

    // Compter les trimestres payés (hors droit d'adhésion)
    const trimestresPayes = membre.cotisations.filter(
      (c: any) => 
        c.statut === 'PAYEE' && 
        c.typeCotisation &&
        !c.typeCotisation.libelle.toLowerCase().includes('adhésion')
    ).length;

    // Calculer le retard
    const trimestresManquants = Math.max(0, trimestresRequis - trimestresPayes);
    const montantDu = trimestresManquants * 10000;

    // Calculer le total payé
    const totalPaye = membre.cotisations
      .filter((c: any) => c.statut === 'PAYEE')
      .reduce((sum: number, c: any) => sum + (Number(c.montant) || 0), 0);

    // Déterminer le statut
    let statut: string;
    let estAJour: boolean;

    if (trimestresRequis === 0) {
      statut = 'À jour (nouveau)';
      estAJour = true;
    } else if (trimestresPayes >= trimestresRequis) {
      statut = 'À jour';
      estAJour = true;
    } else {
      statut = 'En retard';
      estAJour = false;
    }

    return {
      estAJour,
      statut,
      trimestresManquants,
      montantDu,
      totalPaye,
      trimestresRequis,
      trimestresPayes,
    };
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      return;
    }

    try {
      await api.delete(`/membres/${id}`);
      toast.success('Membre supprimé', 'Le membre a été supprimé avec succès');
      fetchMembres();
    } catch (error) {
      toast.error('Erreur', 'Impossible de supprimer ce membre');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Membres</h1>
          <p className="text-gray-500 mt-1">
            Gérez les adhérents de votre mutuelle
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Nouveau membre</span>
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
        >
          <span>📥</span>
          <span>Importer</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, matricule ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Filtre par statut */}
          <div className="w-full md:w-48">
            <select
              value={statutFilter}
              onChange={(e) => {
                setStatutFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="SUSPENDU">Suspendu</option>
              <option value="RADIE">Radié</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table des membres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matricule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom complet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sexe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'adhésion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cotisations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : membres.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Aucun membre trouvé
                  </td>
                </tr>
              ) : (
                membres.map((membre) => (
                  <tr key={membre.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {membre.matricule}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {membre.prenom} {membre.nom}
                      </div>
                      {membre.email && (
                        <div className="text-sm text-gray-500">{membre.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {membre.sexe}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {membre.telephone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(membre.dateAdhesion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatutBadge(membre.statut)}`}
                      >
                        {membre.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const stats = calculerStatutCotisations(membre);
                        return (
                          <div className="flex flex-col space-y-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              stats.estAJour
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {stats.estAJour ? '✓ À jour' : `✗ ${stats.trimestresManquants} trim. retard`}
                            </span>
                            <span className="text-xs text-gray-500">
                              Payé: {stats.totalPaye.toLocaleString()} XOF
                            </span>
                            {!stats.estAJour && stats.montantDu > 0 && (
                              <span className="text-xs text-red-600 font-semibold">
                                Dû: {stats.montantDu.toLocaleString()} XOF
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedMembreId(membre.id);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMembreId(membre.id);
                            setEditModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => {
                            setCardMembre(membre);
                            setShowCardModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Carte de membre"
                        >
                          🪪
                        </button>
                        <button
                          onClick={() => {
                            setAttestationMembre(membre);
                            setShowAttestationModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Attestation d'adhésion"
                        >
                          📄
                        </button>
                        <button
                          onClick={() => handleDelete(membre.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Barre de Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-b-xl shadow-sm">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de{' '}
                  <span className="font-medium">{Math.min((page - 1) * limit + 1, totalMembres)}</span> à{' '}
                  <span className="font-medium">{Math.min(page * limit, totalMembres)}</span> sur{' '}
                  <span className="font-medium">{totalMembres}</span> membres
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-l-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    &laquo; Précédent
                  </button>
                  
                  {/* Génération dynamique des numéros de page */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                    .map((p, index, array) => {
                      const prev = array[index - 1];
                      if (prev && p - prev > 1) {
                        return (
                          <span key={`ellipsis-${p}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            p === page
                              ? 'z-10 bg-blue-600 text-white focus:z-20'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant &raquo;
                  </button>
                </nav>
              </div>
            </div>
            
            {/* Version Mobile */}
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="flex items-center text-sm text-gray-700">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modale de création */}
      <MembreFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={fetchMembres}
      />
      <MembreEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={fetchMembres}
        membreId={selectedMembreId}
      />

      <MembreDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        membreId={selectedMembreId}
      />
      {/* Modale carte de membre */}
      <MemberCardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        membre={cardMembre}
      />
      {/* Modale attestation d'adhésion */}
      <AttestationAdhesionModal
        isOpen={showAttestationModal}
        onClose={() => setShowAttestationModal(false)}
        membre={attestationMembre}
      />
      {/* Modale d'import */}
      <ImportMembresModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchMembres}
      />
    </div>
  );
}