'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import CotisationFormModal from '@/components/cotisations/cotisation-form-modal';
import CotisationPayerModal from '@/components/cotisations/cotisation-payer-modal';
import PaymentReceiptModal from '@/components/cotisations/payment-receipt-modal';
import { toast } from '@/store/toast-store';

interface Cotisation {
  id: string;
  membreId: string;
  typeCotisationId: string;
  montant: number;
  periode: string;
  datePaiement?: string;
  modePaiement?: string;
  reference?: string;
  statut: string;
  membre: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
  };
  typeCotisation: {
    id: string;
    libelle: string;
  };
}

interface CotisationsResponse {
  data: Cotisation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function CotisationsPage() {
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [meta, setMeta] = useState<CotisationsResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statutFilter, setStatutFilter] = useState('');
  const [periodeFilter, setPeriodeFilter] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [showPayerModal, setShowPayerModal] = useState(false);
  const [selectedCotisationId, setSelectedCotisationId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptCotisation, setReceiptCotisation] = useState<Cotisation | null>(null);
  const fetchCotisations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (statutFilter) params.append('statut', statutFilter);
      if (periodeFilter) params.append('periode', periodeFilter);

      const response = await api.get(`/cotisations?${params.toString()}`);
      setCotisations(response.data.data);
      setMeta(response.data.meta);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCotisations();
  }, [page, statutFilter, periodeFilter]);

  const getStatutBadge = (statut: string) => {
    const styles = {
      PAYEE: 'bg-green-100 text-green-800',
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      EN_RETARD: 'bg-red-100 text-red-800',
      ANNULEE: 'bg-gray-100 text-gray-800',
    };
    return styles[statut as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const handleAnnuler = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette cotisation ?')) {
      return;
    }

    try {
      await api.patch(`/cotisations/${id}/annuler`);
      fetchCotisations();
    } catch (error) {
      alert('Erreur lors de l\'annulation');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cotisations</h1>
          <p className="text-gray-500 mt-1">
            Gérez les cotisations et paiements des membres
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Nouvelle cotisation</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Filtre par statut */}
          <div className="flex-1">
            <select
              value={statutFilter}
              onChange={(e) => {
                setStatutFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="PAYEE">Payée</option>
              <option value="EN_RETARD">En retard</option>
              <option value="ANNULEE">Annulée</option>
            </select>
          </div>

          {/* Filtre par période */}
          <div className="flex-1">
            <input
              type="month"
              value={periodeFilter}
              onChange={(e) => {
                setPeriodeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Filtrer par période"
            />
          </div>
        </div>
      </div>

      {/* Table des cotisations */}
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
                  Période
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
              ) : cotisations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Aucune cotisation trouvée
                  </td>
                </tr>
              ) : (
                cotisations.map((cotisation) => (
                  <tr key={cotisation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cotisation.membre.prenom} {cotisation.membre.nom}
                      </div>
                      <div className="text-sm text-gray-500">
                        {cotisation.membre.matricule}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cotisation.typeCotisation.libelle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cotisation.periode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {Number(cotisation.montant).toLocaleString()} XOF
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatutBadge(cotisation.statut)}`}
                      >
                        {cotisation.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {cotisation.statut === 'EN_ATTENTE' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCotisationId(cotisation.id);
                                setShowPayerModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Payer
                            </button>
                            <button
                              onClick={() => handleAnnuler(cotisation.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Annuler
                            </button>
                          </>
                        )}
                        {cotisation.statut === 'PAYEE' && (
                          <button
                            onClick={() => {
                              setReceiptCotisation(cotisation);
                              setShowReceipt(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            title="Voir le reçu"
                          >
                            🧾 Reçu
                          </button>
                        )}
                        {cotisation.statut === 'ANNULEE' && (
                          <span className="text-gray-400">✗ Annulée</span>
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
              Page {meta.page} sur {meta.totalPages} ({meta.total} cotisations)
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
      <CotisationFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={fetchCotisations}
      />
      <CotisationPayerModal
        isOpen={showPayerModal}
        onClose={() => setShowPayerModal(false)}
        onSuccess={(cotisationPayee) => {
          toast.success('Paiement enregistré', 'La cotisation a été payée avec succès');
          fetchCotisations();
          // Afficher le reçu
          setReceiptCotisation(cotisationPayee);
          setShowReceipt(true);
        }}
        cotisationId={selectedCotisationId}
      />

      {/* Modale de reçu */}
      <PaymentReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        cotisation={
          receiptCotisation
            ? {
                ...receiptCotisation,
                datePaiement: receiptCotisation.datePaiement ?? '',
                modePaiement: receiptCotisation.modePaiement ?? 'ESPECES',
                reference: receiptCotisation.reference ?? '',
              }
            : null
        }
      />
    </div>
  );
}