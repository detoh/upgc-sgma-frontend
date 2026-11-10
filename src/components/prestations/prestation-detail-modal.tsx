'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface PrestationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prestationId: string | null;
  onAction: () => void; // Callback pour rafraîchir la liste après action
}

interface HistoriqueEntry {
  date: string;
  action: string;
  details: string;
  userId: string | null;
  userName: string;
}

interface Prestation {
  id: string;
  membreId: string;
  typePrestation: string;
  dateEvenement: string;
  description?: string;
  montant: number;
  statut: string;
  historique?: HistoriqueEntry[];
  membre: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
  };
  beneficiaire?: {
    nom: string;
    prenom: string;
    lienParente: string;
  };
  validePar?: {
    nom: string;
    prenom: string;
  };
  payePar?: {
    nom: string;
    prenom: string;
  };
}

const TYPE_PRESTATION_LABELS: Record<string, string> = {
  NAISSANCE: 'Naissance',
  MARIAGE_MEMBRE: 'Mariage du membre',
  DECES_PERE: 'Décès du père',
  DECES_MERE: 'Décès de la mère',
  DECES_CONJOINT: 'Décès du conjoint',
  DECES_ENFANT: "Décès d'un enfant",
  DEPART_RETRAITE: 'Départ à la retraite',
  MUTATION: 'Mutation',
};

const ACTION_LABELS: Record<string, string> = {
  CREATION: 'Création',
  VALIDATION: 'Validation',
  REJET: 'Rejet',
  PAIEMENT: 'Paiement',
};

const ACTION_COLORS: Record<string, string> = {
  CREATION: 'bg-blue-500',
  VALIDATION: 'bg-green-500',
  REJET: 'bg-red-500',
  PAIEMENT: 'bg-purple-500',
};

export default function PrestationDetailModal({ isOpen, onClose, prestationId, onAction }: PrestationDetailModalProps) {
  const [prestation, setPrestation] = useState<Prestation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prestationId && isOpen) {
      fetchPrestation();
    }
  }, [prestationId, isOpen]);

  const fetchPrestation = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/prestations/${prestationId}`);
      setPrestation(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !prestation) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatutBadge = (statut: string) => {
    const styles = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      VALIDEE: 'bg-blue-100 text-blue-800',
      REJETEE: 'bg-red-100 text-red-800',
      PAYEE: 'bg-green-100 text-green-800',
    };
    return styles[statut as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Détails de la prestation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Chargement...</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Informations générales */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Informations générales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Membre</p>
                  <p className="font-medium text-gray-800">
                    {prestation.membre.prenom} {prestation.membre.nom}
                  </p>
                  <p className="text-sm text-gray-500">{prestation.membre.matricule}</p>
                </div>
                {prestation.beneficiaire && (
                  <div>
                    <p className="text-sm text-gray-500">Bénéficiaire</p>
                    <p className="font-medium text-gray-800">
                      {prestation.beneficiaire.prenom} {prestation.beneficiaire.nom}
                    </p>
                    <p className="text-sm text-gray-500">{prestation.beneficiaire.lienParente}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Type de prestation</p>
                  <p className="font-medium text-gray-800">
                    {TYPE_PRESTATION_LABELS[prestation.typePrestation] || prestation.typePrestation}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de l'événement</p>
                  <p className="font-medium text-gray-800">
                    {new Date(prestation.dateEvenement).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant</p>
                  <p className="font-bold text-2xl text-blue-600">
                    {Number(prestation.montant).toLocaleString()} XOF
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatutBadge(prestation.statut)}`}>
                    {prestation.statut.replace('_', ' ')}
                  </span>
                </div>
              </div>
              {prestation.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-800">{prestation.description}</p>
                </div>
              )}
            </div>

            {/* Historique */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Historique des actions</h3>
              {prestation.historique && prestation.historique.length > 0 ? (
                <div className="space-y-4">
                  {prestation.historique.map((entry, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      {/* Point coloré */}
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${ACTION_COLORS[entry.action] || 'bg-gray-400'}`}></div>
                      
                      {/* Contenu */}
                      <div className="flex-1 border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800">
                            {ACTION_LABELS[entry.action] || entry.action}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(entry.date)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{entry.details}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Par : {entry.userName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun historique disponible</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}