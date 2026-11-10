'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface CotisationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TypeCotisation {
  id: string;
  libelle: string;
}

interface Membre {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
}

export default function CotisationFormModal({ isOpen, onClose, onSuccess }: CotisationFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typesCotisation, setTypesCotisation] = useState<TypeCotisation[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [formData, setFormData] = useState({
    membreId: '',
    typeCotisationId: '',
    montant: '',
    periode: new Date().toISOString().slice(0, 7), // YYYY-MM
    statut: 'EN_ATTENTE',
  });

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [typesRes, membresRes] = await Promise.all([
        api.get('/cotisations/types'),
        api.get('/membres?limit=1000'),
      ]);
      setTypesCotisation(typesRes.data);
      setMembres(membresRes.data.data);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/cotisations', {
        ...formData,
        membreId: parseInt(formData.membreId),
        typeCotisationId: parseInt(formData.typeCotisationId),
        montant: parseFloat(formData.montant),
      });
      onSuccess();
      onClose();
      setFormData({
        membreId: '',
        typeCotisationId: '',
        montant: '',
        periode: new Date().toISOString().slice(0, 7),
        statut: 'EN_ATTENTE',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Nouvelle cotisation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Membre <span className="text-red-500">*</span>
            </label>
            <select
              name="membreId"
              value={formData.membreId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">-- Sélectionner un membre --</option>
              {membres.map((membre) => (
                <option key={membre.id} value={membre.id}>
                  {membre.matricule} - {membre.prenom} {membre.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de cotisation <span className="text-red-500">*</span>
            </label>
            <select
              name="typeCotisationId"
              value={formData.typeCotisationId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">-- Sélectionner un type --</option>
              {typesCotisation.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.libelle}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Ex: 5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Période <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                name="periode"
                value={formData.periode}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer la cotisation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}