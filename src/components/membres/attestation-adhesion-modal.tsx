'use client';

interface Membre {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance?: string;
  dateAdhesion: string;
  telephone?: string;
  email?: string;
  statut: string;
}

interface AttestationAdhesionModalProps {
  isOpen: boolean;
  onClose: () => void;
  membre: Membre | null;
}

const MUTUELLE_INFO = {
  nom: 'UPGC MUTUELLE',
  nomComplet: 'Union des Producteurs de Gbêkê',
  adresse: 'Bouaké, Côte d\'Ivoire',
  telephone: '+225 07 00 00 00 00',
  email: 'contact@upgc-mutuelle.ci',
  president: 'Le Président de la Mutuelle',
};

export default function AttestationAdhesionModal({ isOpen, onClose, membre }: AttestationAdhesionModalProps) {
  if (!isOpen || !membre) return null;

  const formatDateLongue = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateNumerique = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  // Générer un numéro d'attestation unique
  const numeroAttestation = `ATT-${new Date().getFullYear()}-${membre.id}`;

  // Date d'émission (aujourd'hui)
  const dateEmission = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #attestation-print,
          #attestation-print * {
            visibility: visible;
          }
          #attestation-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 20mm;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8">
          {/* En-tête de la modale (non imprimé) */}
          <div className="no-print border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📄 Attestation d'adhésion
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          {/* Zone d'impression - Document A4 */}
          <div id="attestation-print" className="bg-white p-12" style={{ minHeight: '1000px' }}>
            {/* EN-TÊTE DU DOCUMENT */}
            <div className="border-b-4 border-blue-600 pb-6 mb-8">
              <div className="flex items-start justify-between">
                {/* Logo à gauche */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    U
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {MUTUELLE_INFO.nom}
                    </h1>
                    <p className="text-sm text-gray-600">{MUTUELLE_INFO.nomComplet}</p>
                    <p className="text-xs text-gray-500 mt-1">📍 {MUTUELLE_INFO.adresse}</p>
                    <p className="text-xs text-gray-500">📞 {MUTUELLE_INFO.telephone}</p>
                    <p className="text-xs text-gray-500">✉️ {MUTUELLE_INFO.email}</p>
                  </div>
                </div>

                {/* Référence à droite */}
                <div className="text-right">
                  <p className="text-xs text-gray-500">N° d'attestation</p>
                  <p className="font-mono font-bold text-gray-800">{numeroAttestation}</p>
                  <p className="text-xs text-gray-500 mt-2">Émise le</p>
                  <p className="font-semibold text-gray-800">{dateEmission}</p>
                </div>
              </div>
            </div>

            {/* TITRE DU DOCUMENT */}
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-wide underline decoration-blue-600 decoration-4 underline-offset-8">
                Attestation d'Adhésion
              </h2>
            </div>

            {/* CORPS DU DOCUMENT */}
            <div className="space-y-6 text-gray-700 leading-relaxed text-justify">
              <p className="text-lg">
                Je soussigné(e), <strong>{MUTUELLE_INFO.president}</strong> de la mutuelle{' '}
                <strong>{MUTUELLE_INFO.nom}</strong>, atteste par la présente que :
              </p>

              {/* Informations du membre dans un encadré */}
              <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-6 my-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600 uppercase tracking-wide">Nom et Prénoms</p>
                    <p className="text-xl font-bold text-gray-800">
                      {membre.nom} {membre.prenom}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 uppercase tracking-wide">Matricule</p>
                    <p className="text-xl font-bold text-gray-800 font-mono">{membre.matricule}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 uppercase tracking-wide">Sexe</p>
                    <p className="font-medium text-gray-800">
                      {membre.sexe === 'M' ? 'Masculin' : 'Féminin'}
                    </p>
                  </div>
                  {membre.dateNaissance && (
                    <div>
                      <p className="text-sm text-blue-600 uppercase tracking-wide">Date de naissance</p>
                      <p className="font-medium text-gray-800">{formatDateLongue(membre.dateNaissance)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-blue-600 uppercase tracking-wide">Date d'adhésion</p>
                    <p className="font-medium text-gray-800">{formatDateLongue(membre.dateAdhesion)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 uppercase tracking-wide">Statut</p>
                    <p className={`font-bold ${
                      membre.statut === 'ACTIF' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {membre.statut}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-lg">
                est membre actif de notre mutuelle depuis le{' '}
                <strong>{formatDateLongue(membre.dateAdhesion)}</strong> et s'est acquitté(e) de son{' '}
                <strong>droit d'adhésion</strong> conformément aux statuts et règlement intérieur de la mutuelle.
              </p>

              <p className="text-lg">
                En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.
              </p>
            </div>

            {/* SIGNATURES */}
            <div className="mt-16 flex justify-between items-start">
              {/* Signature du Président */}
              <div className="text-center w-64">
                <p className="font-semibold text-gray-800 mb-2">{MUTUELLE_INFO.president}</p>
                <div className="h-24 border-b-2 border-gray-400 mb-2 flex items-end justify-center">
                  <p className="text-xs text-gray-400 italic pb-2">Signature et cachet</p>
                </div>
              </div>

              {/* Signature du membre */}
              <div className="text-center w-64">
                <p className="font-semibold text-gray-800 mb-2">Le Membre</p>
                <div className="h-24 border-b-2 border-gray-400 mb-2 flex items-end justify-center">
                  <p className="text-xs text-gray-400 italic pb-2">{membre.prenom} {membre.nom}</p>
                </div>
              </div>
            </div>

            {/* PIED DE PAGE */}
            <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center">
              <p className="text-xs text-gray-500">
                {MUTUELLE_INFO.nom} - {MUTUELLE_INFO.nomComplet}
              </p>
              <p className="text-xs text-gray-500">
                {MUTUELLE_INFO.adresse} | Tél : {MUTUELLE_INFO.telephone} | Email : {MUTUELLE_INFO.email}
              </p>
              <p className="text-xs text-gray-400 mt-2 italic">
                Document généré automatiquement - Fait à Bouaké, le {dateEmission}
              </p>
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
              <span>Imprimer l'attestation</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}