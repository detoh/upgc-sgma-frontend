'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import FamilleFormModal from '@/components/membres/famille-form-modal';
import { toast } from '@/store/toast-store';

interface MembreFamille {
  id: string;
  nom: string;
  prenom: string;
  lienParente: string;
  dateNaissance?: string;
  telephone?: string;
}

interface Cotisation {
  id: string;
  montant: number | string;
  periode: string;
  statut: string;
  datePaiement?: string;
  typeCotisation?: { libelle: string };
}

interface Prestation {
  id: string;
  typePrestation: string;
  dateEvenement: string;
  description?: string;
  montant: number | string;
  statut: string;
}

interface Membre {
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
  famille: MembreFamille[];
  cotisations: Cotisation[];
  prestations: Prestation[];
}

type Onglet = 'infos' | 'famille' | 'cotisations' | 'prestations';

export default function MonEspacePage() {
  const [membre, setMembre] = useState<Membre | null>(null);
  const [famille, setFamille] = useState<MembreFamille[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFamille, setShowAddFamille] = useState(false);
  const [activeTab, setActiveTab] = useState<Onglet>('infos');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/membres/me');
      setMembre(res.data);
      setFamille(res.data.famille || []);
    } catch (error: any) {
      toast.error('Erreur', 'Impossible de charger votre espace membre');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // SITUATION DES COTISATIONS (même logique que la page Membres)
  // ==========================================
  const calculerSituation = (m: Membre) => {
    // Protection contre les données nulles
    if (!m || !m.cotisations) {
      return { 
        estAJour: false, 
        statut: 'Non renseigné', 
        trimestresRequis: 0, 
        trimestresPayes: 0, 
        trimestresManquants: 0, 
        montantDu: 0, 
        totalPaye: 0 
      };
    }

    const cotisations = m.cotisations || [];
    const now = new Date();
    const dateAdhesion = new Date(m.dateAdhesion);

    // Vérifier que la date est valide
    if (isNaN(dateAdhesion.getTime())) {
      return { 
        estAJour: false, 
        statut: 'Date d\'adhésion invalide', 
        trimestresRequis: 0, 
        trimestresPayes: 0, 
        trimestresManquants: 0, 
        montantDu: 0, 
        totalPaye: 0 
      };
    }

    const trimestreActuel = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3) + 1;
    const trimestreAdhesion = dateAdhesion.getFullYear() * 4 + Math.floor(dateAdhesion.getMonth() / 3) + 1;
    const trimestresRequis = Math.max(0, trimestreActuel - trimestreAdhesion);

    const trimestresPayes = cotisations.filter(
      (c) =>
        c.statut === 'PAYEE' &&
        c.typeCotisation &&
        !c.typeCotisation.libelle.toLowerCase().includes('adhésion')
    ).length;

    const trimestresManquants = Math.max(0, trimestresRequis - trimestresPayes);
    const montantDu = trimestresManquants * 10000;

    const totalPaye = cotisations
      .filter((c) => c.statut === 'PAYEE')
      .reduce((sum, c) => sum + (Number(c.montant) || 0), 0);

    let statut: string;
    let estAJour: boolean;
    if (trimestresRequis === 0) {
      statut = 'À jour (nouveau membre)';
      estAJour = true;
    } else if (trimestresPayes >= trimestresRequis) {
      statut = 'À jour';
      estAJour = true;
    } else {
      statut = 'En retard';
      estAJour = false;
    }

    return { estAJour, statut, trimestresRequis, trimestresPayes, trimestresManquants, montantDu, totalPaye };
  };

  const handleDeleteFamille = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet ayant droit ?')) return;
    try {
      await api.delete(`/membres/me/famille/${id}`);
      toast.success('Succès', 'Ayant droit supprimé');
      fetchData();
    } catch (error) {
      toast.error('Erreur', 'Impossible de supprimer cet ayant droit');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-'; // Date invalide
    return date.toLocaleDateString('fr-FR');
  };

  const formatMontant = (m: number | string) =>
    (Number(m) || 0).toLocaleString('fr-FR') + ' XOF';

  const getStatutMembreBadge = (statut: string) => {
    const styles: Record<string, string> = {
      ACTIF: 'bg-green-100 text-green-800',
      SUSPENDU: 'bg-yellow-100 text-yellow-800',
      RADIE: 'bg-red-100 text-red-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatutCotisationBadge = (statut: string) => {
    const styles: Record<string, string> = {
      PAYEE: 'bg-green-100 text-green-800',
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      EN_RETARD: 'bg-red-100 text-red-800',
      ANNULEE: 'bg-gray-100 text-gray-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const getStatutPrestationBadge = (statut: string) => {
    const styles: Record<string, string> = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      VALIDEE: 'bg-blue-100 text-blue-800',
      REJETEE: 'bg-red-100 text-red-800',
      PAYEE: 'bg-green-100 text-green-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const getTypePrestationLabel = (type: string) => {
    const labels: Record<string, string> = {
      NAISSANCE: 'Naissance',
      MARIAGE_MEMBRE: 'Mariage du membre',
      DECES_PERE: 'Décès du père',
      DECES_MERE: 'Décès de la mère',
      DECES_CONJOINT: 'Décès du conjoint',
      DECES_ENFANT: "Décès de l'enfant",
      DEPART_RETRAITE: 'Départ à la retraite',
      MUTATION: 'Mutation',
    };
    return labels[type] || type;
  };

  const getLienParenteLabel = (lien: string) => {
    const labels: Record<string, string> = {
      PERE: 'Père',
      MERE: 'Mère',
      CONJOINT: 'Conjoint(e)',
      ENFANT: 'Enfant',
    };
    return labels[lien] || lien;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!membre) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <p className="text-yellow-800">
          Aucun profil membre n'est associé à votre compte.
          Veuillez contacter un administrateur.
        </p>
      </div>
    );
  }

  const situation = calculerSituation(membre);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Mon Espace</h1>
        <p className="text-gray-500 mt-1">
          Consultez toutes vos informations : dossier, famille, cotisations et prestations
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Onglets */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <TabButton active={activeTab === 'infos'} onClick={() => setActiveTab('infos')}>
            📋 Mes informations
          </TabButton>
          <TabButton active={activeTab === 'famille'} onClick={() => setActiveTab('famille')}>
            👨‍👩‍👧‍👦 Ma famille ({famille.length})
          </TabButton>
          <TabButton active={activeTab === 'cotisations'} onClick={() => setActiveTab('cotisations')}>
            💰 Mes cotisations ({(membre.cotisations || []).length})
          </TabButton>
          <TabButton active={activeTab === 'prestations'} onClick={() => setActiveTab('prestations')}>
            🏥 Mes prestations ({(membre.prestations || []).length})
          </TabButton>
        </div>

        <div className="p-6">
          {/* ============ ONGLET : MES INFORMATIONS ============ */}
          {activeTab === 'infos' && (
            <div className="space-y-6">
              {/* Carte de situation */}
              <div className={`rounded-xl p-4 border ${situation.estAJour ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Situation des cotisations</p>
                    <p className={`text-lg font-bold ${situation.estAJour ? 'text-green-700' : 'text-red-700'}`}>
                      {situation.statut}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 md:text-right">
                    <p>Trimestres payés : <span className="font-semibold">{situation.trimestresPayes} / {situation.trimestresRequis}</span></p>
                    <p>Total versé : <span className="font-semibold">{formatMontant(situation.totalPaye)}</span></p>
                    {!situation.estAJour && (
                      <p className="text-red-600 font-semibold">Montant dû : {formatMontant(situation.montantDu)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations du dossier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Matricule" value={membre.matricule} />
                <InfoField label="Statut" value={
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatutMembreBadge(membre.statut)}`}>
                    {membre.statut}
                  </span>
                } />
                <InfoField label="Nom" value={membre.nom} />
                <InfoField label="Prénom" value={membre.prenom} />
                <InfoField label="Sexe" value={membre.sexe === 'M' ? 'Masculin' : 'Féminin'} />
                <InfoField label="Date de naissance" value={formatDate(membre.dateNaissance)} />
                <InfoField label="Profession" value={membre.profession || '-'} />
                <InfoField label="Date d'adhésion" value={formatDate(membre.dateAdhesion)} />
                <InfoField label="Téléphone" value={membre.telephone || '-'} />
                <InfoField label="Email" value={membre.email || '-'} />
                <div className="md:col-span-2">
                  <InfoField label="Adresse" value={membre.adresse || '-'} />
                </div>
              </div>
            </div>
          )}

          {/* ============ ONGLET : MA FAMILLE ============ */}
          {activeTab === 'famille' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddFamille(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Ajouter un ayant droit</span>
                </button>
              </div>

              {famille.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">Aucun ayant droit enregistré</p>
                  <p className="text-sm mt-2">Cliquez sur "Ajouter un ayant droit" pour commencer</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <Th>Nom complet</Th>
                        <Th>Lien</Th>
                        <Th>Date naiss.</Th>
                        <Th>Téléphone</Th>
                        <Th right>Actions</Th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {famille.map((f) => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <Td>{f.prenom} {f.nom}</Td>
                          <Td>{getLienParenteLabel(f.lienParente)}</Td>
                          <Td>{formatDate(f.dateNaissance)}</Td>
                          <Td>{f.telephone || '-'}</Td>
                          <Td right>
                            <button
                              onClick={() => handleDeleteFamille(f.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Supprimer
                            </button>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ============ ONGLET : MES COTISATIONS ============ */}
          {activeTab === 'cotisations' && (
            <div className="space-y-4">
              {(membre.cotisations || []).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">Aucune cotisation enregistrée</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <Th>Période</Th>
                        <Th>Type</Th>
                        <Th>Montant</Th>
                        <Th>Statut</Th>
                        <Th>Date de paiement</Th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(membre.cotisations || []).map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <Td>{c.periode}</Td>
                          <Td>{c.typeCotisation?.libelle || '-'}</Td>
                          <Td><span className="font-medium">{formatMontant(c.montant)}</span></Td>
                          <Td>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatutCotisationBadge(c.statut)}`}>
                              {c.statut}
                            </span>
                          </Td>
                          <Td>{formatDate(c.datePaiement)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ============ ONGLET : MES PRESTATIONS ============ */}
          {activeTab === 'prestations' && (
            <div className="space-y-4">
              {(membre.prestations || []).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">Aucune prestation enregistrée</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <Th>Type</Th>
                        <Th>Date événement</Th>
                        <Th>Montant</Th>
                        <Th>Statut</Th>
                        <Th>Description</Th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {membre.prestations.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <Td><span className="font-medium">{getTypePrestationLabel(p.typePrestation)}</span></Td>
                          <Td>{formatDate(p.dateEvenement)}</Td>
                          <Td>{formatMontant(p.montant)}</Td>
                          <Td>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatutPrestationBadge(p.statut)}`}>
                              {p.statut}
                            </span>
                          </Td>
                          <Td>{p.description || '-'}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'ajout d'ayant droit */}
      <FamilleFormModal
        isOpen={showAddFamille}
        onClose={() => setShowAddFamille(false)}
        onSuccess={fetchData}
        membreId={membre.id}
        forCurrentUser={true}
      />
    </div>
  );
}

// ==========================================
// COMPOSANTS HELPERS
// ==========================================
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 font-medium transition-colors whitespace-nowrap ${
        active
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <div className="text-gray-900 font-medium">{value}</div>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-700 ${right ? 'text-right' : ''}`}>
      {children}
    </td>
  );
}