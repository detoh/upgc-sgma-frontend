'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Don {
  id: string;
  structureDonatrice: string;
  montant: number;
  dateDon: string;
  modePaiement: string;
  motif?: string;
  reference?: string;
  utilisateur?: {
    nom: string;
    prenom: string;
  };
}

export default function DonsPage() {
  const [dons, setDons] = useState<Don[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    structureDonatrice: '',
    montant: '',
    modePaiement: 'ESPECES',
    motif: '',
    reference: '',
  });

  const fetchDons = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dons');
      setDons(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDons();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/dons', {
        ...formData,
        montant: parseFloat(formData.montant),
      });
      setShowForm(false);
      setFormData({
        structureDonatrice: '',
        montant: '',
        modePaiement: 'ESPECES',
        motif: '',
        reference: '',
      });
      fetchDons();
    } catch (error) {
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const getModePaiementLabel = (mode: string) => {
    const labels: Record<string, string> = {
      ESPECES: 'Espèces',
      MOBILE_MONEY: 'Mobile Money',
      VIREMENT: 'Virement',
      CHEQUE: 'Chèque',
      CARTE: 'Carte',
    };
    return labels[mode] || mode;
  };

  const totalDons = dons.reduce((sum, don) => sum + Number(don.montant), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dons</h1>
          <p className="text-gray-500 mt-1">Dons reçus par la mutuelle</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ Enregistrer un don
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <p className="text-purple-100 mb-1">Total des dons</p>
          <p className="text-3xl font-bold">{totalDons.toLocaleString()} XOF</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-blue-100 mb-1">Nombre de dons</p>
          <p className="text-3xl font-bold">{dons.length}</p>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nouveau don</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="structureDonatrice"
                value={formData.structureDonatrice}
                onChange={handleChange}
                required
                placeholder="Structure donatrice *"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="number"
                name="montant"
                value={formData.montant}
                onChange={handleChange}
                required
                min="0"
                placeholder="Montant (XOF) *"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="modePaiement"
                value={formData.modePaiement}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ESPECES">Espèces</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="VIREMENT">Virement</option>
                <option value="CHEQUE">Chèque</option>
                <option value="CARTE">Carte</option>
              </select>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="Référence"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <textarea
              name="motif"
              value={formData.motif}
              onChange={handleChange}
              rows={2}
              placeholder="Motif du don"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des dons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Structure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motif</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : dons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Aucun don enregistré</td>
                </tr>
              ) : (
                dons.map((don) => (
                  <tr key={don.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {don.structureDonatrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {Number(don.montant).toLocaleString()} XOF
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(don.dateDon)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getModePaiementLabel(don.modePaiement)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {don.motif || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}