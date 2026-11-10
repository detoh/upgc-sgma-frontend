'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface PrestationPayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prestationId: string | null;
}

export default function PrestationPayerModal({ isOpen, onClose, onSuccess, prestationId }: PrestationPayerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prestation, setPrestation] = useState<any>(null);
  const [formData, setFormData] = useState({
    modePaiement: 'ESPECES',
    reference: '',
    datePaiement: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (prestationId && isOpen) {
      fetchPrestation();
    }
  }, [prestationId, isOpen]);

  const fetchPrestation = async () => {
    try {
      const response = await api.get(`/prestations/${prestationId}`);
      setPrestation(response.data);
    } catch (err) {
      setError('Erreur lors du chargement');
    }
  };

  if (!isOpen || !prestation) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.patch(`/prestations/${prestationId}/payer`, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Payer la prestation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Récapitulatif */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Membre</p>
            <p className="font-semibold text-gray-800">
              {prestation.membre.prenom} {prestation.membre.nom}
            </p>
            <p className="text-sm text-gray-600 mt-2 mb-1">Montant à payer</p>
            <p className="text-2xl font-bold text-green-600">
              {Number(prestation.montant).toLocaleString()} XOF
            </p>
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode de paiement <span className="text-red-500">*</span>
            </label>
            <select
              name="modePaiement"
              value={formData.modePaiement}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="ESPECES">Espèces</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="VIREMENT">Virement bancaire</option>
              <option value="CHEQUE">Chèque</option>
              <option value="CARTE">Carte bancaire</option>
            </select>
          </div>

          {/* Référence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence (optionnel)
            </label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="Ex: PREST-2026-001"
            />
          </div>

          {/* Boutons */}
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Confirmer le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}