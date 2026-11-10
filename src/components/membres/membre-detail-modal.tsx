'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import FamilleFormModal from './famille-form-modal';
import { toast } from '@/store/toast-store';
import MemberCardModal from './member-card-modal';
import AttestationAdhesionModal from './attestation-adhesion-modal';

interface MembreDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  membreId: string | null;
}

interface MembreDetail {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  profession?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  dateAdhesion: string;
  statut: string;
  famille: Array<{
    id: string;
    nom: string;
    prenom: string;
    lienParente: string;
    dateNaissance?: string;
  }>;
  cotisations: Array<{
    id: string;
    montant: number;
    periode: string;
    statut: string;
    datePaiement?: string;
    typeCotisation: {
      libelle: string;
    };
  }>;
  prestations: Array<{
    id: string;
    typePrestation: string;
    montant: number;
    statut: string;
    dateEvenement: string;
  }>;
}

const TYPE_PRESTATION_LABELS: Record<string, string> = {
  NAISSANCE: 'Naissance',
  MARIAGE_MEMBRE: 'Mariage',
  DECES_PERE: 'Décès père',
  DECES_MERE: 'Décès mère',
  DECES_CONJOINT: 'Décès conjoint',
  DECES_ENFANT: 'Décès enfant',
  DEPART_RETRAITE: 'Retraite',
  MUTATION: 'Mutation',
};

export default function MembreDetailModal({ isOpen, onClose, membreId }: MembreDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [membre, setMembre] = useState<MembreDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'infos' | 'famille' | 'cotisations' | 'prestations'>('infos');
  const [showFamilleForm, setShowFamilleForm] = useState(false);
  const [cotisationsStats, setCotisationsStats] = useState<any>({});
  const [showCardModal, setShowCardModal] = useState(false);
  const [showAttestationModal, setShowAttestationModal] = useState(false);
  useEffect(() => {
    if (membreId && isOpen) {
      fetchMembre();
      fetchCotisationsStats();
    }
  }, [membreId, isOpen]);

  const fetchMembre = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/membres/${membreId}`);
      setMembre(response.data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCotisationsStats = async () => {
    try {
      const response = await api.get(`/membres/${membreId}/statut-cotisations`);
      setCotisationsStats(response.data);
    } catch (err) {
      console.error('Erreur fetchCotisationsStats:', err);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      ACTIF: 'bg-green-100 text-green-800',
      SUSPENDU: 'bg-yellow-100 text-yellow-800',
      RADIE: 'bg-red-100 text-red-800',
      PAYEE: 'bg-green-100 text-green-800',
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      EN_RETARD: 'bg-red-100 text-red-800',
      ANNULEE: 'bg-gray-100 text-gray-800',
      VALIDEE: 'bg-blue-100 text-blue-800',
      REJETEE: 'bg-red-100 text-red-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'infos', label: 'Informations' },
    { id: 'famille', label: `Famille (${membre?.famille?.length || 0})` },
    { id: 'cotisations', label: `Cotisations (${membre?.cotisations?.length || 0})` },
    { id: 'prestations', label: `Prestations (${membre?.prestations?.length || 0})` },
  ];

  const handleDeleteFamille = async (familleId: string) => {
    if (!confirm('Supprimer cet ayant droit ?')) return;

    try {
      await api.delete(`/membres/famille/${familleId}`);
      fetchMembre();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCardModal(true)}
              className="text-white hover:text-blue-200 text-lg px-3 py-1 bg-white/20 rounded-lg transition-colors"
              title="Carte de membre"
            >
              🪪 Carte
            </button>
            <button
              onClick={() => setShowAttestationModal(true)}
              className="text-white hover:text-blue-200 text-lg px-3 py-1 bg-white/20 rounded-lg transition-colors"
              title="Attestation d'adhésion"
            >
              📄 Attestation
            </button>
            <button onClick={onClose} className="text-white hover:text-blue-200 text-2xl">×</button>
          </div>

        {/* Onglets */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Chargement...</div>
          ) : !membre ? (
            <div className="text-center text-gray-500 py-8">Erreur de chargement</div>
          ) : (
            <>
              {/* Onglet Informations */}
              {activeTab === 'infos' && (
                <div className="space-y-6">
                  {/* Grille 2 colonnes : Identité + Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 border-b pb-2">Identité</h3>
                      <div>
                        <p className="text-sm text-gray-500">Nom complet</p>
                        <p className="font-medium">{membre.prenom} {membre.nom}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sexe</p>
                        <p className="font-medium">{membre.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date de naissance</p>
                        <p className="font-medium">{formatDate(membre.dateNaissance)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Profession</p>
                        <p className="font-medium">{membre.profession || '-'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 border-b pb-2">Contact & Adhésion</h3>
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="font-medium">{membre.telephone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{membre.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Adresse</p>
                        <p className="font-medium">{membre.adresse || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date d'adhésion</p>
                        <p className="font-medium">{formatDate(membre.dateAdhesion)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Statut</p>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatutBadge(membre.statut)}`}>
                          {membre.statut}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bloc Situation des cotisations */}
                  <div className={`mt-6 p-4 border rounded-lg ${
                    !cotisationsStats || cotisationsStats.trimestresRequis === undefined
                      ? 'bg-gray-50 border-gray-200'
                      : cotisationsStats.estAJour
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      !cotisationsStats || cotisationsStats.trimestresRequis === undefined
                        ? 'text-gray-800'
                        : cotisationsStats.estAJour
                        ? 'text-green-800'
                        : 'text-red-800'
                    }`}>
                      {!cotisationsStats || cotisationsStats.trimestresRequis === undefined
                        ? '⏳ Situation des cotisations'
                        : cotisationsStats.estAJour
                        ? '✅ Situation des cotisations'
                        : '⚠️ Situation des cotisations'}
                    </h4>
                    {cotisationsStats && cotisationsStats.trimestresRequis !== undefined ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-sm ${cotisationsStats.estAJour ? 'text-green-600' : 'text-red-600'}`}>
                            Trimestres requis
                          </p>
                          <p className={`font-bold ${cotisationsStats.estAJour ? 'text-green-800' : 'text-red-800'}`}>
                            {cotisationsStats.trimestresRequis}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${cotisationsStats.estAJour ? 'text-green-600' : 'text-red-600'}`}>
                            Trimestres payés
                          </p>
                          <p className={`font-bold ${cotisationsStats.estAJour ? 'text-green-800' : 'text-red-800'}`}>
                            {cotisationsStats.trimestresPayes}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${cotisationsStats.estAJour ? 'text-green-600' : 'text-red-600'}`}>
                            Total payé
                          </p>
                          <p className={`font-bold ${cotisationsStats.estAJour ? 'text-green-800' : 'text-red-800'}`}>
                            {Number(cotisationsStats.totalPaye).toLocaleString()} XOF
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${cotisationsStats.estAJour ? 'text-green-600' : 'text-red-600'}`}>
                            Statut
                          </p>
                          <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                            cotisationsStats.estAJour
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {cotisationsStats.statut}
                          </span>
                        </div>
                        
                        {/* Si en retard, afficher le montant dû */}
                        {!cotisationsStats.estAJour && (
                          <>
                            <div>
                              <p className="text-sm text-red-600">Trimestres manquants</p>
                              <p className="font-bold text-red-800">{cotisationsStats.trimestresManquants}</p>
                            </div>
                            <div>
                              <p className="text-sm text-red-600">Montant dû</p>
                              <p className="font-bold text-red-800">{cotisationsStats.montantDu.toLocaleString()} XOF</p>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">Chargement des statistiques...</p>
                    )}
                  </div>
                </div>
              )}

              {/* Onglet Famille */}
              {activeTab === 'famille' && (
                <div>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setShowFamilleForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-2"
                    >
                      <span>➕</span>
                      <span>Ajouter un ayant droit</span>
                    </button>
                  </div>

                  {membre.famille.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aucun ayant droit enregistré</p>
                  ) : (
                    <div className="space-y-3">
                      {membre.famille.map((fam) => (
                        <div key={fam.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-800">{fam.prenom} {fam.nom}</p>
                            <p className="text-sm text-gray-500">
                              {fam.lienParente}
                              {fam.dateNaissance && ` • Né(e) le ${formatDate(fam.dateNaissance)}`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {fam.lienParente}
                            </span>
                            <button
                              onClick={() => handleDeleteFamille(fam.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <FamilleFormModal
                    isOpen={showFamilleForm}
                    onClose={() => setShowFamilleForm(false)}
                    onSuccess={fetchMembre}
                    membreId={membreId}
                  />
                </div>
              )}

              {/* Onglet Cotisations */}
              {activeTab === 'cotisations' && (
                <div>
                  {membre.cotisations.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aucune cotisation</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {membre.cotisations.map((cot) => {
                          const isDroitAdhesion = cot.typeCotisation.libelle.toLowerCase().includes('adhésion');
                          return (
                            <tr key={cot.id} className={isDroitAdhesion ? 'bg-blue-50' : ''}>
                              <td className="px-4 py-3 text-sm">
                                {cot.typeCotisation.libelle}
                                {isDroitAdhesion && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    Adhésion
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">{cot.periode}</td>
                              <td className="px-4 py-3 text-sm font-medium">
                                {Number(cot.montant).toLocaleString()} XOF
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatutBadge(cot.statut)}`}>
                                  {cot.statut}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Onglet Prestations */}
              {activeTab === 'prestations' && (
                <div>
                  {membre.prestations.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aucune prestation</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {membre.prestations.map((prest) => (
                          <tr key={prest.id}>
                            <td className="px-4 py-3 text-sm">
                              {TYPE_PRESTATION_LABELS[prest.typePrestation] || prest.typePrestation}
                            </td>
                            <td className="px-4 py-3 text-sm">{formatDate(prest.dateEvenement)}</td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {Number(prest.montant).toLocaleString()} XOF
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatutBadge(prest.statut)}`}>
                                {prest.statut}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pied de page */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>

        {/* 👇 AJOUTER ICI */}
        <MemberCardModal
          isOpen={showCardModal}
          onClose={() => setShowCardModal(false)}
          membre={membre}
        />
        {/* Modale attestation d'adhésion */}
        <AttestationAdhesionModal
          isOpen={showAttestationModal}
          onClose={() => setShowAttestationModal(false)}
          membre={membre}
        />
      </div>
    </div>
  );
}