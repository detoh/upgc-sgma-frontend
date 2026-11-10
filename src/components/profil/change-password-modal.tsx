'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { toast } from '@/store/toast-store';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    motDePasseActuel: '',
    nouveauMotDePasse: '',
    confirmationMotDePasse: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation côté client
    if (formData.nouveauMotDePasse !== formData.confirmationMotDePasse) {
      toast.error('Erreur', 'Le nouveau mot de passe et la confirmation ne correspondent pas');
      return;
    }

    if (formData.nouveauMotDePasse.length < 6) {
      toast.error('Erreur', 'Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/auth/change-password', formData);
      toast.success('Mot de passe modifié', 'Votre mot de passe a été changé avec succès');
      onClose();
      setFormData({
        motDePasseActuel: '',
        nouveauMotDePasse: '',
        confirmationMotDePasse: '',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
      toast.error('Échec', message);
    } finally {
      setLoading(false);
    }
  };

  // Vérifier la force du mot de passe
  const getPasswordStrength = (password: string) => {
    if (!password) return { level: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, label: 'Faible', color: 'bg-red-500' };
    if (score <= 3) return { level: 2, label: 'Moyen', color: 'bg-yellow-500' };
    return { level: 3, label: 'Fort', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(formData.nouveauMotDePasse);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* En-tête */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            🔒 Changer le mot de passe
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mot de passe actuel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe actuel <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="motDePasseActuel"
                value={formData.motDePasseActuel}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-12"
                placeholder="Votre mot de passe actuel"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="nouveauMotDePasse"
              value={formData.nouveauMotDePasse}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Minimum 6 caractères"
            />
            
            {/* Indicateur de force */}
            {formData.nouveauMotDePasse && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full ${
                        level <= strength.level ? strength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Force : <span className="font-medium">{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmationMotDePasse"
              value={formData.confirmationMotDePasse}
              onChange={handleChange}
              required
              minLength={6}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none ${
                formData.confirmationMotDePasse &&
                formData.confirmationMotDePasse !== formData.nouveauMotDePasse
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Répétez le nouveau mot de passe"
            />
            {formData.confirmationMotDePasse &&
              formData.confirmationMotDePasse !== formData.nouveauMotDePasse && (
                <p className="text-xs text-red-500 mt-1">
                  ❌ Les mots de passe ne correspondent pas
                </p>
              )}
          </div>

          {/* Conseils de sécurité */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              💡 <strong>Conseils :</strong> Utilisez au moins 8 caractères avec des majuscules, 
              des chiffres et des caractères spéciaux pour un mot de passe fort.
            </p>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}