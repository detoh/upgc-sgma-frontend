'use client';

import api from '@/lib/api';

interface Cotisation {
  id: string;
  montant: number;
  periode: string;
  datePaiement: string;
  modePaiement: string;
  reference?: string;
  statut: string;
  membre: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
  };
  typeCotisation: {
    libelle: string;
  };
}

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  cotisation: Cotisation | null;
}

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  ESPECES: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  VIREMENT: 'Virement bancaire',
  CHEQUE: 'Chèque',
  CARTE: 'Carte bancaire',
};

export default function PaymentReceiptModal({ isOpen, onClose, cotisation }: PaymentReceiptModalProps) {
  if (!isOpen || !cotisation) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatMontant = (montant: number) => {
    return Number(montant || 0).toLocaleString('fr-FR');
  };

  // Convertir le montant en lettres (version simple)
  const montantEnLettres = (montant: number): string => {
    if (montant === 0) return 'zéro';
    
    const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
      'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

    const convertMilliers = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return unites[n];
      
      const d = Math.floor(n / 10);
      const u = n % 10;
      
      if (d === 7 || d === 9) {
        return dizaines[d] + '-' + unites[10 + u];
      }
      
      let result = dizaines[d];
      if (u === 1 && d < 8) result += ' et un';
      else if (u > 0) result += '-' + unites[u];
      else if (d === 8) result += 's';
      
      return result;
    };

    const milliers = Math.floor(montant / 1000);
    const reste = montant % 1000;
    
    let result = '';
    if (milliers > 0) {
      result += milliers === 1 ? 'mille' : convertMilliers(milliers) + ' mille';
    }
    if (reste > 0) {
      if (result) result += ' ';
      result += convertMilliers(reste);
    }
    
    return result + ' francs CFA';
  };

  const handlePrint = () => {
    window.print();
  };

  // Générer un numéro de reçu basé sur la référence ou l'ID
  const numeroRecu = cotisation.reference || `REC-${cotisation.id}`;

  return (
    <>
      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print,
          #receipt-print * {
            visibility: visible;
          }
          #receipt-print {
            position: absolute;
            left: 50%;
            top: 0;
            transform: translateX(-50%);
            width: 80mm;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* En-tête de la modale (non imprimé) */}
          <div className="no-print border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Reçu de paiement</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>

          {/* Zone imprimable */}
          <div id="receipt-print" className="p-6">
            {/* En-tête du reçu */}
            <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                U
              </div>
              <h3 className="font-bold text-gray-800 text-lg">UPGC MUTUELLE</h3>
              <p className="text-xs text-gray-500">Union des Producteurs de Gbêkê</p>
              <p className="text-xs text-gray-500">Bouaké, Côte d'Ivoire</p>
            </div>

            {/* Titre du reçu */}
            <div className="text-center mb-4">
              <h4 className="font-bold text-gray-800 uppercase tracking-wide">
                Reçu de Paiement
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                N° <span className="font-mono font-bold">{numeroRecu}</span>
              </p>
            </div>

            {/* Informations du paiement */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Date :</span>
                <span className="font-medium text-gray-800">
                  {formatDate(cotisation.datePaiement)}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-gray-500 text-xs mb-1">Reçu de</p>
                <p className="font-bold text-gray-800 uppercase">
                  {cotisation.membre.nom} {cotisation.membre.prenom}
                </p>
                <p className="text-xs text-gray-500">
                  Matricule : <span className="font-mono">{cotisation.membre.matricule}</span>
                </p>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-gray-500 text-xs mb-1">Pour</p>
                <p className="font-medium text-gray-800">
                  {cotisation.typeCotisation.libelle}
                </p>
                <p className="text-xs text-gray-500">
                  Période : {cotisation.periode}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-gray-500 text-xs mb-1">Mode de paiement</p>
                <p className="font-medium text-gray-800">
                  {MODE_PAIEMENT_LABELS[cotisation.modePaiement] || cotisation.modePaiement}
                </p>
              </div>

              {/* Montant */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium">Montant payé</span>
                  <span className="text-2xl font-bold text-blue-800">
                    {formatMontant(cotisation.montant)} F
                  </span>
                </div>
                <p className="text-xs text-blue-600 italic mt-1">
                  Arrêté la somme de : {montantEnLettres(cotisation.montant)}
                </p>
              </div>
            </div>

            {/* Pied de page du reçu */}
            <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300">
              <div className="flex justify-between items-end">
                <div className="text-xs text-gray-500">
                  <p className="font-medium text-gray-700">Le Caissier</p>
                  <div className="w-24 border-b border-gray-400 mt-6"></div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>Merci de votre paiement</p>
                  <p className="mt-1">UPGC Mutuelle</p>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons (non imprimés) */}
          <div className="no-print border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>🖨️</span>
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}