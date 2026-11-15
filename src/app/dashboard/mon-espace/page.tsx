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
}

export default function MonEspacePage() {
  const [membre, setMembre] = useState<Membre | null>(null);
  const [famille, setFamille] = useState<MembreFamille[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFamille, setShowAddFamille] = useState(false);
  const [activeTab, setActiveTab] = useState<'infos' | 'famille'>('infos');

  const fetchData = async () => {
    setLoading(true);
    try {
      const membreRes = await api.get('/membres/me');
      setMembre(membreRes.data);
      setFamille(membreRes.data.famille || []);
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
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

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      ACTIF: 'bg-green-100 text-green-800',
      SUSPENDU: 'bg-yellow-100 text-yellow-800',
      RADIE: 'bg-red-100 text-red-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Mon Espace</h1>
        <p className="text-gray-500 mt-1">
          Consultez vos informations et gérez votre famille
        </p>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('infos')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'infos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Mes informations
          </button>
          <button
            onClick={() => setActiveTab('famille')}
            className={`px-6 py-4 font-medium transition-colors ${
              activeTab === 'famille'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👨‍👩‍👧‍👦 Ma famille ({famille.length})
          </button>
        </div>

        {/* Contenu de l'onglet */}
        <div className="p-6">
          {activeTab === 'infos' && (
            <div className="space-y-6">
              {/* Carte d'identité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Matricule" value={membre.matricule} />
                <InfoField label="Statut" value={
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatutBadge(membre.statut)}`}>
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
                  <p className="text-sm mt-2">
                    Cliquez sur "Ajouter un ayant droit" pour commencer
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom complet</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lien</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date naiss.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {famille.map((f) => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {f.prenom} {f.nom}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getLienParenteLabel(f.lienParente)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(f.dateNaissance || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {f.telephone || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => handleDeleteFamille(f.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Supprimer
                            </button>
                          </td>
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

      {/* Modal d'ajout de famille */}
      <FamilleFormModal
        isOpen={showAddFamille}
        onClose={() => setShowAddFamille(false)}
        onSuccess={fetchData}
        membreId={membre.id}
        forCurrentUser={true}  // 🆕 Utilise la route /me/famille
      />
    </div>
  );
}

// Composant helper pour les champs d'information
function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <div className="text-gray-900 font-medium">{value}</div>
    </div>
  );
}