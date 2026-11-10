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

interface MemberCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  membre: Membre | null;
}

const MUTUELLE_INFO = {
  nom: 'UPGC MUTUELLE',
  slogan: 'Union des Producteurs de Gbêkê',
  adresse: 'Bouaké, Côte d\'Ivoire',
  telephone: '+225 07 00 00 00 00',
  email: 'contact@upgc-mutuelle.ci',
  devise: 'XOF',
};

export default function MemberCardModal({ isOpen, onClose, membre }: MemberCardModalProps) {
  if (!isOpen || !membre) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  // Calculer la date d'expiration (1 an après l'adhésion)
  const getExpirationDate = () => {
    const dateAdhesion = new Date(membre.dateAdhesion);
    const dateExpiration = new Date(dateAdhesion);
    dateExpiration.setFullYear(dateExpiration.getFullYear() + 1);
    return dateExpiration.toLocaleDateString('fr-FR');
  };

  // Données du QR code (contient les infos du membre)
  const qrData = encodeURIComponent(
    JSON.stringify({
      matricule: membre.matricule,
      nom: membre.nom,
      prenom: membre.prenom,
      statut: membre.statut,
      mutuelle: MUTUELLE_INFO.nom,
    })
  );

  // URL de l'API QR code (pas besoin d'installer de package)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;

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
          #card-print,
          #card-print * {
            visibility: visible;
          }
          #card-print {
            position: absolute;
            left: 50%;
            top: 20mm;
            transform: translateX(-50%);
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
          {/* En-tête de la modale (non imprimé) */}
          <div className="no-print border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              🪪 Carte de membre
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          {/* Zone d'impression */}
          <div id="card-print" className="p-6 space-y-4">
            {/* ===== RECTO DE LA CARTE ===== */}
            <div className="relative w-[340px] h-[214px] mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-300">
              {/* Fond dégradé */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800"></div>
              
              {/* Motif décoratif */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>

              {/* Contenu recto */}
              <div className="relative h-full flex flex-col p-4 text-white">
                {/* En-tête : Logo + Nom mutuelle */}
                <div className="flex items-center justify-between border-b border-white/30 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-lg">U</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{MUTUELLE_INFO.nom}</p>
                      <p className="text-[8px] opacity-90">{MUTUELLE_INFO.slogan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] opacity-80">CARTE MEMBRE</p>
                    <p className="text-[9px] font-semibold">{membre.statut}</p>
                  </div>
                </div>

                {/* Corps : Avatar + Infos */}
                <div className="flex items-center gap-3 mt-3 flex-1">
                  {/* Avatar */}
                  <div className="w-20 h-24 bg-white/20 border-2 border-white/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-bold">
                      {membre.prenom[0]}{membre.nom[0]}
                    </span>
                  </div>

                  {/* Infos membre */}
                  <div className="flex-1 space-y-1">
                    <div>
                      <p className="text-[8px] opacity-75 uppercase">Nom et Prénoms</p>
                      <p className="font-bold text-sm leading-tight">
                        {membre.nom} {membre.prenom}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-[8px] opacity-75 uppercase">Matricule</p>
                        <p className="font-semibold text-xs font-mono">{membre.matricule}</p>
                      </div>
                      <div>
                        <p className="text-[8px] opacity-75 uppercase">Sexe</p>
                        <p className="font-semibold text-xs">
                          {membre.sexe === 'M' ? 'Masculin' : 'Féminin'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-[8px] opacity-75 uppercase">Adhésion</p>
                        <p className="font-semibold text-xs">{formatDate(membre.dateAdhesion)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] opacity-75 uppercase">Expire le</p>
                        <p className="font-semibold text-xs">{getExpirationDate()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pied recto */}
                <div className="flex items-center justify-between text-[7px] opacity-90 border-t border-white/30 pt-1">
                  <span>📍 {MUTUELLE_INFO.adresse}</span>
                  <span>📞 {MUTUELLE_INFO.telephone}</span>
                </div>
              </div>
            </div>

            {/* ===== VERSO DE LA CARTE ===== */}
            <div className="relative w-[340px] h-[214px] mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-300">
              {/* Fond */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white"></div>
              
              {/* Bandeau supérieur */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-r from-blue-700 to-blue-600 flex items-center justify-between px-4">
                <p className="text-white font-bold text-xs">{MUTUELLE_INFO.nom}</p>
                <p className="text-white/80 text-[8px]">VERSO</p>
              </div>

              {/* Contenu verso */}
              <div className="relative h-full pt-12 pb-3 px-4 flex">
                {/* Colonne gauche : QR Code */}
                <div className="flex flex-col items-center justify-center gap-2 w-1/3">
                  <div className="w-24 h-24 bg-white p-1 border border-gray-300 rounded">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-full h-full"
                    />
                  </div>
                  <p className="text-[7px] text-gray-600 text-center">
                    Scannez pour vérifier
                  </p>
                </div>

                {/* Colonne droite : Infos et conditions */}
                <div className="flex-1 pl-3 space-y-2">
                  <div>
                    <p className="text-[9px] font-bold text-gray-800 uppercase border-b border-gray-300 pb-1">
                      Conditions d'utilisation
                    </p>
                    <ul className="text-[7px] text-gray-600 mt-1 space-y-0.5">
                      <li>• Cette carte est strictement personnelle</li>
                      <li>• Elle doit être présentée lors de chaque prestation</li>
                      <li>• Valable uniquement si le membre est à jour de ses cotisations</li>
                      <li>• En cas de perte, contacter la mutuelle</li>
                    </ul>
                  </div>

                  <div className="border-t border-gray-300 pt-2">
                    <p className="text-[7px] text-gray-600">
                      <strong>Contact :</strong> {MUTUELLE_INFO.telephone}
                    </p>
                    <p className="text-[7px] text-gray-600">
                      <strong>Email :</strong> {MUTUELLE_INFO.email}
                    </p>
                  </div>

                  {/* Signature */}
                  <div className="flex justify-between items-end mt-2">
                    <div className="text-[7px] text-gray-600">
                      <p className="font-semibold">Le Président</p>
                      <div className="w-16 border-b border-gray-400 mt-3"></div>
                    </div>
                    <div className="text-[7px] text-gray-500 italic text-right">
                      <p>Signature du membre :</p>
                      <div className="w-16 border-b border-gray-400 mt-3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions (imprimées) */}
            <div className="text-center text-xs text-gray-500 mt-4">
              <p>📐 Format : Carte bancaire (85.6mm × 54mm)</p>
              <p>💡 Imprimez sur papier bristol 300g pour une meilleure durabilité</p>
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
              <span>Imprimer la carte</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}