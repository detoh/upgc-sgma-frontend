'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface PrestationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Membre {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  statut: string;
}

interface Beneficiaire {
  id: string;
  nom: string;
  prenom: string;
  lienParente: string;
}

interface StatutComplet {
  membre: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    statut: string;
    telephone?: string;
    email?: string;
    dateAdhesion: string;
  };
  cotisations: {
    estAJour: boolean;
    trimestresRequis: number;
    trimestresPayes: number;
    trimestresManquants: number;
    montantDu: number;
    cotisationsImpayees: number;
  };
}

const TYPES_PRESTATION = [
  { value: 'NAISSANCE', label: 'Naissance', icon: '👶' },
  { value: 'MARIAGE_MEMBRE', label: 'Mariage du membre', icon: '💒' },
  { value: 'DECES_PERE', label: 'Décès du père', icon: '⚫' },
  { value: 'DECES_MERE', label: 'Décès de la mère', icon: '⚫' },
  { value: 'DECES_CONJOINT', label: 'Décès du conjoint', icon: '⚫' },
  { value: 'DECES_ENFANT', label: "Décès d'un enfant", icon: '⚫' },
  { value: 'DEPART_RETRAITE', label: 'Départ à la retraite', icon: '🎉' },
  { value: 'MUTATION', label: 'Mutation', icon: '🚚' },
];

export default function PrestationFormModal({ isOpen, onClose, onSuccess }: PrestationFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStatut, setLoadingStatut] = useState(false);
  const [error, setError] = useState('');
  const [membres, setMembres] = useState<Membre[]>([]);
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([]);
  const [statutComplet, setStatutComplet] = useState<StatutComplet | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    membreId: '',
    beneficiaireId: '',
    typePrestation: 'NAISSANCE',
    dateEvenement: new Date().toISOString().split('T')[0],
    description: '',
    montant: '',
  });

  // Charger les membres au premier rendu
  useEffect(() => {
    if (isOpen) {
      loadMembres();
    }
  }, [isOpen]);

  // Charger les bénéficiaires et le statut quand on sélectionne un membre
  useEffect(() => {
    if (formData.membreId) {
      loadBeneficiaires(formData.membreId);
      loadStatutComplet(formData.membreId);
    } else {
      setBeneficiaires([]);
      setStatutComplet(null);
    }
  }, [formData.membreId]);

  const loadMembres = async () => {
    try {
      const response = await api.get('/membres?limit=1000');
      setMembres(response.data.data);
    } catch (err) {
      setError('Erreur lors du chargement des membres');
    }
  };

  const loadBeneficiaires = async (membreId: string) => {
    try {
      const response = await api.get(`/membres/${membreId}/famille`);
      setBeneficiaires(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des bénéficiaires:', err);
    }
  };

  const loadStatutComplet = async (membreId: string) => {
    setLoadingStatut(true);
    try {
      const response = await api.get(`/membres/${membreId}/statut-complet`);
      setStatutComplet(response.data);
      setError('');
    } catch (err: any) {
      console.error('Erreur lors du chargement du statut:', err);
      setStatutComplet(null);
    } finally {
      setLoadingStatut(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filtrer les membres selon la recherche
  const filteredMembres = membres.filter(membre => {
    const search = searchTerm.toLowerCase();
    return (
      membre.matricule.toLowerCase().includes(search) ||
      membre.nom.toLowerCase().includes(search) ||
      membre.prenom.toLowerCase().includes(search)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Vérification : membre actif et à jour
    if (!statutComplet) {
      setError('Impossible de vérifier le statut du membre');
      return;
    }

    if (statutComplet.membre.statut !== 'ACTIF') {
      setError(`Ce membre n'est pas actif (statut: ${statutComplet.membre.statut})`);
      return;
    }

    if (!statutComplet.cotisations.estAJour) {
      setError(`Ce membre n'est pas à jour de ses cotisations (${statutComplet.cotisations.trimestresManquants} trimestre(s) manquant(s)). Il doit régulariser sa situation avant de bénéficier d'une prestation.`);
      return;
    }

    setLoading(true);

    try {
      await api.post('/prestations', {
        membreId: parseInt(formData.membreId),
        beneficiaireId: formData.beneficiaireId ? parseInt(formData.beneficiaireId) : undefined,
        typePrestation: formData.typePrestation,
        dateEvenement: formData.dateEvenement,
        description: formData.description,
        montant: parseFloat(formData.montant),
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      membreId: '',
      beneficiaireId: '',
      typePrestation: 'NAISSANCE',
      dateEvenement: new Date().toISOString().split('T')[0],
      description: '',
      montant: '',
    });
    setStatutComplet(null);
    setSearchTerm('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Nouvelle demande de prestation</h2>
          <button onClick={() => { onClose(); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Sélection du membre avec recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Membre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Rechercher par matricule, nom ou prénom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <select
              name="membreId"
              value={formData.membreId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none max-h-48"
              size={5}
            >
              <option value="">-- Sélectionner un membre --</option>
              {filteredMembres.map((membre) => (
                <option key={membre.id} value={membre.id}>
                  {membre.matricule} - {membre.prenom} {membre.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Affichage du statut du membre sélectionné */}
          {formData.membreId && loadingStatut && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700">Vérification du statut...</span>
              </div>
            </div>
          )}

          {formData.membreId && statutComplet && (
            <div className={`rounded-lg p-4 border ${
              statutComplet.membre.statut === 'ACTIF' && statutComplet.cotisations.estAJour
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {statutComplet.membre.prenom} {statutComplet.membre.nom}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {statutComplet.membre.matricule}
                    {statutComplet.membre.telephone && ` • ${statutComplet.membre.telephone}`}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  statutComplet.membre.statut === 'ACTIF'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {statutComplet.membre.statut}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Situation des cotisations :</span>
                  {statutComplet.cotisations.estAJour ? (
                    <span className="text-green-700 font-semibold">✅ À jour</span>
                  ) : (
                    <span className="text-red-700 font-semibold">⚠️ {statutComplet.cotisations.trimestresManquants} trimestre(s) manquant(s)</span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Trimestres payés : {statutComplet.cotisations.trimestresPayes} / {statutComplet.cotisations.trimestresRequis}
                </div>
                {!statutComplet.cotisations.estAJour && (
                  <div className="mt-2 text-xs text-red-600 font-semibold">
                    Montant dû : {statutComplet.cotisations.montantDu.toLocaleString()} XOF
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bénéficiaire (optionnel) */}
          {formData.membreId && beneficiaires.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bénéficiaire (ayant droit)
              </label>
              <select
                name="beneficiaireId"
                value={formData.beneficiaireId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">-- Le membre lui-même --</option>
                {beneficiaires.map((ben) => (
                  <option key={ben.id} value={ben.id}>
                    {ben.prenom} {ben.nom} ({ben.lienParente})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type de prestation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de prestation <span className="text-red-500">*</span>
            </label>
            <select
              name="typePrestation"
              value={formData.typePrestation}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {TYPES_PRESTATION.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date événement et Montant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de l'événement <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateEvenement"
                value={formData.dateEvenement}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant (XOF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                required
                min="0"
                step="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Ex: 25000"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Détails supplémentaires sur la demande..."
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => { onClose(); resetForm(); }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !statutComplet?.cotisations.estAJour || statutComplet?.membre.statut !== 'ACTIF'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}