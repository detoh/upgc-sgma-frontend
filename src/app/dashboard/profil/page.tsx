'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/store/toast-store';
import ChangePasswordModal from '@/components/profil/change-password-modal';


interface UserProfile {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: string;
  actif: boolean;
  dateCreation: string;
  dernierAcces?: string;
  membres?: Array<{
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
  }>;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  GESTIONNAIRE: 'Gestionnaire',
  CAISSIER: 'Caissier',
  MEMBRE: 'Membre',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 border-red-300',
  GESTIONNAIRE: 'bg-blue-100 text-blue-800 border-blue-300',
  CAISSIER: 'bg-green-100 text-green-800 border-green-300',
  MEMBRE: 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function ProfilPage() {
  const { user: authUser, setUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/me');
      setProfile(response.data);
      setFormData({
        nom: response.data.nom,
        prenom: response.data.prenom,
        email: response.data.email,
        telephone: response.data.telephone || '',
      });
    } catch (error) {
      toast.error('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.patch('/auth/me', formData);
      const updatedProfile = response.data;
      
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
      
      if (authUser) {
        setUser({
          ...authUser,
          nom: updatedProfile.nom,
          prenom: updatedProfile.prenom,
          email: updatedProfile.email,
        });
      }
      
      toast.success('Profil mis à jour', 'Vos informations ont été enregistrées avec succès');
    } catch (error: any) {
      toast.error('Erreur', error.response?.data?.message || 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Erreur de chargement du profil</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Mon profil</h1>
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte d'identité */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-24"></div>
            
            <div className="px-6 pb-6">
              <div className="flex justify-center -mt-12 mb-4">
                <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">
                    {profile.prenom[0]}{profile.nom[0]}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {profile.prenom} {profile.nom}
                </h2>
                <p className="text-gray-500 text-sm">{profile.email}</p>
                
                <div className="mt-3">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${ROLE_COLORS[profile.role]}`}>
                    {ROLE_LABELS[profile.role]}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Statut du compte</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    profile.actif
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile.actif ? 'Actif' : 'Désactivé'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Compte créé le</span>
                  <span className="text-gray-800 font-medium">
                    {formatDate(profile.dateCreation)}
                  </span>
                </div>
                {profile.dernierAcces && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Dernier accès</span>
                    <span className="text-gray-800 font-medium">
                      {formatDate(profile.dernierAcces)}
                    </span>
                  </div>
                )}
              </div>

              {profile.membres && profile.membres.length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Membre associé
                  </h3>
                  {profile.membres.map((membre) => (
                    <div key={membre.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {membre.prenom[0]}{membre.nom[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {membre.prenom} {membre.nom}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{membre.matricule}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulaire de modification */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Modifier mes informations
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    minLength={2}
                    maxLength={100}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                    minLength={2}
                    maxLength={100}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    pattern="^[0-9\s\+\-]{8,20}$"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Ex: 0700000000"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  ℹ️ <strong>Note :</strong> Pour des raisons de sécurité, vous ne pouvez pas modifier votre rôle vous-même. 
                  Seul un administrateur peut changer les rôles des utilisateurs.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={fetchProfile}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>

          {/* Sécurité du compte */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🔒 Sécurité du compte
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Mot de passe</p>
                <p className="text-sm text-gray-500">
                  Modifiez régulièrement votre mot de passe pour sécuriser votre compte
                </p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Changer le mot de passe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 👇 MODALE DE CHANGEMENT DE MOT DE PASSE */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}