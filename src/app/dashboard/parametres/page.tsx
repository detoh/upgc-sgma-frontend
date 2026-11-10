'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ParametresPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    nomMutuelle: '',
    email: '',
    telephone: '',
    adresse: '',
    devise: 'XOF',
    joursGrace: 0,
    montantCotisationDefaut: '',
  });

  useEffect(() => {
    fetchParametres();
  }, []);

  const fetchParametres = async () => {
    try {
      const response = await api.get('/parametres');
      const data = response.data;
      setFormData({
        nomMutuelle: data.nomMutuelle || '',
        email: data.email || '',
        telephone: data.telephone || '',
        adresse: data.adresse || '',
        devise: data.devise || 'XOF',
        joursGrace: data.joursGrace || 0,
        montantCotisationDefaut: data.montantCotisationDefaut?.toString() || '',
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await api.patch('/parametres', {
        ...formData,
        joursGrace: parseInt(formData.joursGrace.toString()),
        montantCotisationDefaut: formData.montantCotisationDefaut 
          ? parseFloat(formData.montantCotisationDefaut) 
          : undefined,
      });
      setMessage('✅ Paramètres enregistrés avec succès');
    } catch (error) {
      setMessage('❌ Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-gray-500 mt-1">Configuration générale de la mutuelle</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la mutuelle
                </label>
                <input
                  type="text"
                  name="nomMutuelle"
                  value={formData.nomMutuelle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Devise
                </label>
                <select
                  name="devise"
                  value={formData.devise}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="XOF">XOF (Franc CFA)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Coordonnées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <textarea
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Cotisations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cotisations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant cotisation par défaut (XOF)
                </label>
                <input
                  type="number"
                  name="montantCotisationDefaut"
                  value={formData.montantCotisationDefaut}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jours de grâce
                </label>
                <input
                  type="number"
                  name="joursGrace"
                  value={formData.joursGrace}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre de jours après l'échéance avant qu'une cotisation soit considérée en retard
                </p>
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}