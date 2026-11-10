'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface PrestationValiderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prestationId: string | null;
}

export default function PrestationValiderModal({ isOpen, onClose, onSuccess, prestationId }: PrestationValiderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prestation, setPrestation] = useState<any>(null);
  const [decision, setDecision] = useState<'valider' | 'rejeter'>('valider');
  const [motif, setMotif] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.patch(`/prestations/${prestationId}/valider`, {
        valider: decision === 'valider',
        motif: decision === 'rejeter' ? motif : undefined,
      });
      onSuccess();
      onClose();
      setDecision('valider');
      setMotif('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Décision sur la demande</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Récapitulatif */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Membre</p>
            <p className="font-semibold text-gray-800">
              {prestation.membre.prenom} {prestation.membre.nom}
            </p>
            <p className="text-sm text-gray-600 mt-2 mb-1">Montant demandé</p>
            <p className="text-2xl font-bold text-blue-600">
              {Number(prestation.montant).toLocaleString()} XOF
            </p>
            {prestation.description && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Description:</span> {prestation.description}
              </p>
            )}
          </div>

          {/* Décision */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre décision <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setDecision('valider')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  decision === 'valider'
                    ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                ✓ Valider
              </button>
              <button
                type="button"
                onClick={() => setDecision('rejeter')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                  decision === 'rejeter'
                    ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                ✗ Rejeter
              </button>
            </div>
          </div>

          {/* Motif de rejet */}
          {decision === 'rejeter' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motif du rejet <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                required
                rows={3}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                placeholder="Expliquez la raison du rejet..."
              />
            </div>
          )}

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
              className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                decision === 'valider'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Traitement...' : decision === 'valider' ? 'Confirmer la validation' : 'Confirmer le rejet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}