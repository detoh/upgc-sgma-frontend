'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { toast } from '@/store/toast-store';

interface MembreRelance {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  trimestresManquants: number;
  montantDu: number;
  dateAdhesion: string;
}

interface RelanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  membres: MembreRelance[];
  onSuccess: () => void;
}

export default function RelanceModal({ isOpen, onClose, membres, onSuccess }: RelanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [typeRelance, setTypeRelance] = useState<'EMAIL' | 'SMS' | 'LES_DEUX'>('EMAIL');
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  // Filtrer les membres qui ont au moins un moyen de contact
  const membresEmail = membres.filter(m => m.email);
  const membresSMS = membres.filter(m => m.telephone);

  const handleSend = async () => {
    if (membres.length === 0) {
      toast.error('Erreur', 'Aucun membre sélectionné');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: typeRelance,
        membres: membres.map(m => ({
          membreId: m.id,
          nom: m.nom,
          prenom: m.prenom,
          email: m.email,
          telephone: m.telephone,
          trimestresManquants: m.trimestresManquants,
          montantDu: m.montantDu,
          dateAdhesion: m.dateAdhesion,
        })),
      };

      const response = await api.post('/notifications/relance', payload);
      setResult(response.data);

      const totalEnvoyes = response.data.emailsEnvoyes + response.data.smsEnvoyes;
      if (totalEnvoyes > 0) {
        toast.success(
          'Relances envoyées',
          `${response.data.emailsEnvoyes} email(s) et ${response.data.smsEnvoyes} SMS envoyé(s)`
        );
        onSuccess();
      } else {
        toast.warning('Aucun envoi', 'Aucun membre n\'a de coordonnées valides');
      }
    } catch (error: any) {
      toast.error('Erreur', error.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setResult(null);
    setTypeRelance('EMAIL');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        {/* En-tête */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            📧 Envoyer des relances
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Nombre de membres */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-semibold">
              👥 {membres.length} membre(s) sélectionné(s)
            </p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-blue-700">
                📧 {membresEmail.length} avec email
              </span>
              <span className="text-blue-700">
                📱 {membresSMS.length} avec téléphone
              </span>
            </div>
          </div>

          {/* Type de relance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de relance
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTypeRelance('EMAIL')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  typeRelance === 'EMAIL'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">📧</div>
                <div className="text-sm font-medium">Email</div>
                <div className="text-xs text-gray-500">{membresEmail.length} membre(s)</div>
              </button>
              <button
                onClick={() => setTypeRelance('SMS')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  typeRelance === 'SMS'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">📱</div>
                <div className="text-sm font-medium">SMS</div>
                <div className="text-xs text-gray-500">{membresSMS.length} membre(s)</div>
              </button>
              <button
                onClick={() => setTypeRelance('LES_DEUX')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  typeRelance === 'LES_DEUX'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">📧📱</div>
                <div className="text-sm font-medium">Les deux</div>
                <div className="text-xs text-gray-500">Tous les canaux</div>
              </button>
            </div>
          </div>

          {/* Aperçu du message */}
          {membres.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aperçu du message SMS
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono">
                Cher(e) {membres[0].prenom} {membres[0].nom}, votre compte UPGC MUTUELLE présente{' '}
                {membres[0].trimestresManquants} trimestre(s) impayé(s) pour un montant de{' '}
                {membres[0].montantDu.toLocaleString()} FCFA. Merci de régulariser votre situation.
              </div>
            </div>
          )}

          {/* Résultat */}
          {result && (
            <div className={`border rounded-lg p-4 ${
              result.emailsEnvoyes + result.smsEnvoyes > 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="font-semibold mb-2">
                {result.modeDemo && '🧪 '}Résultat de l'envoi
              </h3>
              <ul className="text-sm space-y-1">
                <li>• Total : <strong>{result.total}</strong></li>
                <li>• Emails envoyés : <strong>{result.emailsEnvoyes}</strong></li>
                <li>• SMS envoyés : <strong>{result.smsEnvoyes}</strong></li>
                {result.erreurs.length > 0 && (
                  <li>• Erreurs : <strong className="text-red-600">{result.erreurs.length}</strong></li>
                )}
              </ul>
              {result.modeDemo && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  Mode démo : les messages sont simulés dans la console du serveur.
                </p>
              )}
              {result.erreurs.length > 0 && (
                <div className="mt-2 text-xs text-red-600 max-h-32 overflow-y-auto">
                  {result.erreurs.map((err: string, idx: number) => (
                    <p key={idx}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
          {!result && (
            <button
              onClick={handleSend}
              disabled={loading || membres.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Envoyer {membres.length} relance(s)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}