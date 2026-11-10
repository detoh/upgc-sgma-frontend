'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Activite {
  id: string;
  titre: string;
  description?: string;
  lieu?: string;
  date: string;
  budget?: number;
  responsable?: string;
}

export default function ActivitesPage() {
  const [activites, setActivites] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    lieu: '',
    date: '',
    budget: '',
    responsable: '',
  });

  const fetchActivites = async () => {
    setLoading(true);
    try {
      const response = await api.get('/activites');
      setActivites(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivites();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/activites', {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      });
      setShowForm(false);
      setFormData({ titre: '', description: '', lieu: '', date: '', budget: '', responsable: '' });
      fetchActivites();
    } catch (error) {
      alert('Erreur lors de la création');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette activité ?')) return;
    try {
      await api.delete(`/activites/${id}`);
      fetchActivites();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Activités</h1>
          <p className="text-gray-500 mt-1">Événements et activités de la mutuelle</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ Nouvelle activité
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nouvelle activité</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                required
                placeholder="Titre de l'activité *"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="lieu"
                value={formData.lieu}
                onChange={handleChange}
                placeholder="Lieu"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="Budget (XOF)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <input
              type="text"
              name="responsable"
              value={formData.responsable}
              onChange={handleChange}
              placeholder="Responsable"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Description"
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
                Créer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des activités */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-8">Chargement...</div>
        ) : activites.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">Aucune activité</div>
        ) : (
          activites.map((activite) => (
            <div key={activite.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center text-2xl">
                  📅
                </div>
                <button
                  onClick={() => handleDelete(activite.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  🗑️
                </button>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{activite.titre}</h3>
              <p className="text-sm text-gray-500 mb-3">{formatDate(activite.date)}</p>
              {activite.lieu && (
                <p className="text-sm text-gray-600 mb-1">📍 {activite.lieu}</p>
              )}
              {activite.responsable && (
                <p className="text-sm text-gray-600 mb-1">👤 {activite.responsable}</p>
              )}
              {activite.budget && (
                <p className="text-sm font-semibold text-gray-800">
                  💰 {Number(activite.budget).toLocaleString()} XOF
                </p>
              )}
              {activite.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{activite.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}