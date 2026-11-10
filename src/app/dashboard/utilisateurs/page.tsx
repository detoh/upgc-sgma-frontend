'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: string;
  actif: boolean;
  dateCreation: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  GESTIONNAIRE: 'Gestionnaire',
  CAISSIER: 'Caissier',
  MEMBRE: 'Membre',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  GESTIONNAIRE: 'bg-blue-100 text-blue-800',
  CAISSIER: 'bg-green-100 text-green-800',
  MEMBRE: 'bg-gray-100 text-gray-800',
};

export default function UtilisateursPage() {
  const { user: currentUser } = useAuthStore();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    role: 'GESTIONNAIRE',
  });

  const fetchUtilisateurs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/utilisateurs');
      setUtilisateurs(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilisateurs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMode && selectedUserId) {
        const { motDePasse, ...updateData } = formData;
        await api.patch(`/utilisateurs/${selectedUserId}`, updateData);
      } else {
        await api.post('/utilisateurs', formData);
      }
      setShowForm(false);
      resetForm();
      fetchUtilisateurs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (utilisateur: Utilisateur) => {
    setEditMode(true);
    setSelectedUserId(utilisateur.id);
    setFormData({
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      telephone: utilisateur.telephone || '',
      motDePasse: '',
      role: utilisateur.role,
    });
    setShowForm(true);
  };

  const handleToggleActif = async (id: string) => {
    try {
      await api.patch(`/utilisateurs/${id}/toggle-actif`);
      fetchUtilisateurs();
    } catch (error) {
      alert('Erreur lors du changement de statut');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    try {
      await api.patch(`/utilisateurs/${selectedUserId}/reset-password`, {
        motDePasse: newPassword,
      });
      setShowResetPassword(false);
      setNewPassword('');
      alert('Mot de passe réinitialisé avec succès');
    } catch (error) {
      alert('Erreur lors de la réinitialisation');
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/utilisateurs/${id}`);
      fetchUtilisateurs();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      motDePasse: '',
      role: 'GESTIONNAIRE',
    });
    setEditMode(false);
    setSelectedUserId(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">Gérez les comptes d'accès à l'application</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Nouvel utilisateur</span>
        </button>
      </div>

      {/* Formulaire création/édition */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editMode ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                minLength={2}
                placeholder="Nom *"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
                minLength={2}
                placeholder="Prénom *"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Email *"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="Téléphone"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!editMode && (
                <input
                  type="password"
                  name="motDePasse"
                  value={formData.motDePasse}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Mot de passe *"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              )}
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ADMIN">Administrateur</option>
                <option value="GESTIONNAIRE">Gestionnaire</option>
                <option value="CAISSIER">Caissier</option>
                <option value="MEMBRE">Membre</option>
              </select>
            </div>
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
                {editMode ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau des utilisateurs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé le</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : utilisateurs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Aucun utilisateur</td>
                </tr>
              ) : (
                utilisateurs.map((utilisateur) => (
                  <tr key={utilisateur.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <span className="text-gray-600 font-medium">
                            {utilisateur.prenom[0]}{utilisateur.nom[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {utilisateur.prenom} {utilisateur.nom}
                          </p>
                          {utilisateur.telephone && (
                            <p className="text-xs text-gray-500">{utilisateur.telephone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {utilisateur.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${ROLE_COLORS[utilisateur.role]}`}>
                        {ROLE_LABELS[utilisateur.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        utilisateur.actif
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {utilisateur.actif ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(utilisateur.dateCreation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(utilisateur)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUserId(utilisateur.id);
                            setShowResetPassword(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Réinitialiser mot de passe"
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => handleToggleActif(utilisateur.id)}
                          className={utilisateur.actif ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                          title={utilisateur.actif ? 'Désactiver' : 'Activer'}
                        >
                          {utilisateur.actif ? '🚫' : '✅'}
                        </button>
                        {utilisateur.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(utilisateur.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale reset password */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Réinitialiser le mot de passe</h2>
              <button onClick={() => setShowResetPassword(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Minimum 6 caractères"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Réinitialiser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}