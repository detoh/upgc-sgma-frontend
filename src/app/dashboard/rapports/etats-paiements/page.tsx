'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface MembreEtat {
  numero: number;
  nom: string;
  prenoms: string;
  matricule: string;
  dateAdhesion: string;
  paiements: Record<string, number>;
  etat: string;
}

interface RapportData {
  annee: number;
  mutuelle: {
    nom: string;
    logoUrl: string;
    adresse: string;
    telephone: string;
    email: string;
    devise: string;
  };
  membres: MembreEtat[];
  totaux: Record<string, number>;
  dateGeneration: string;
  nombreTotalMembres: number;
  nombreAJour: number;
  nombreNonAJour: number;
  nombreEnCarence: number;
  montantTotal: number;
}

export default function EtatsPaiementsPage() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [rapport, setRapport] = useState<RapportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const genererRapport = async () => {
    setLoading(true);
    setError('');
    setRapport(null);
    
    try {
      const response = await api.get(`/rapports/etats-paiements?annee=${annee}`);
      setRapport(response.data);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError('❌ Le serveur backend n\'est pas accessible. Vérifiez qu\'il est lancé sur le port 3000.');
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la génération du rapport');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant: number) => {
    return Number(montant || 0).toLocaleString('fr-FR');
  };

  // Générer les colonnes de trimestres (T1 à T4 pour année-1, année, année+1)
  //const trimestres: { year: number; trimestre: number; key: string }[] = [];
  const trimestres: Array<{ year: number; trimestre: number; key: string }> = [];
  for (let y = annee - 1; y <= annee + 1; y++) {
    for (let t = 1; t <= 4; t++) {
      trimestres.push({ year: y, trimestre: t, key: `${y}-T${t}` });
    }
  }

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
          #rapport-print,
          #rapport-print * {
            visibility: visible;
          }
          #rapport-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          table {
            page-break-inside: auto;
            font-size: 9px;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Barre d'outils (non imprimée) */}
        <div className="no-print flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">État des Paiements</h1>
            <p className="text-gray-500 text-sm">Rapport récapitulatif par trimestre</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={annee}
              onChange={(e) => setAnnee(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {[2024, 2025, 2026, 2027, 2028].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={genererRapport}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Génération...' : 'Générer'}
            </button>
            {rapport && (
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <span>🖨️</span>
                <span>Imprimer / PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="no-print bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Zone d'impression */}
        {rapport && (
          <div id="rapport-print" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {/* EN-TÊTE avec LOGO */}
            <div className="border-b-4 border-blue-600 pb-6 mb-6">
              <div className="flex items-start justify-between">
                {/* Logo à gauche */}
                <div className="flex items-center gap-4">
                  {rapport.mutuelle.logoUrl ? (
                    <img
                      src={rapport.mutuelle.logoUrl}
                      alt="Logo"
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {rapport.mutuelle.nom.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {rapport.mutuelle.nom}
                    </h1>
                    {rapport.mutuelle.adresse && (
                      <p className="text-sm text-gray-600">📍 {rapport.mutuelle.adresse}</p>
                    )}
                    {rapport.mutuelle.telephone && (
                      <p className="text-sm text-gray-600">📞 {rapport.mutuelle.telephone}</p>
                    )}
                    {rapport.mutuelle.email && (
                      <p className="text-sm text-gray-600">✉️ {rapport.mutuelle.email}</p>
                    )}
                  </div>
                </div>

                {/* Infos rapport à droite */}
                <div className="text-right">
                  <p className="text-xs text-gray-500">Généré le</p>
                  <p className="font-semibold text-gray-800">
                    {formatDate(rapport.dateGeneration)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Année de référence</p>
                  <p className="text-2xl font-bold text-blue-600">{rapport.annee}</p>
                </div>
              </div>
            </div>

            {/* TITRE */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
                État des Paiements des Cotisations
              </h2>
              <p className="text-gray-600 mt-1">
                Récapitulatif par trimestre — Année {rapport.annee}
              </p>
            </div>

            {/* STATISTIQUES RAPIDES */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded">
                <p className="text-xs text-gray-600">Total membres</p>
                <p className="text-xl font-bold text-blue-800">
                  {rapport.nombreTotalMembres}
                </p>
              </div>
              <div className="bg-green-50 border-l-4 border-green-600 p-3 rounded">
                <p className="text-xs text-gray-600">À jour (Oui)</p>
                <p className="text-xl font-bold text-green-800">
                  {rapport.nombreAJour}
                </p>
              </div>
              <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded">
                <p className="text-xs text-gray-600">Non à jour</p>
                <p className="text-xl font-bold text-red-800">
                  {rapport.nombreNonAJour}
                </p>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-600 p-3 rounded">
                <p className="text-xs text-gray-600">En carence</p>
                <p className="text-xl font-bold text-yellow-800">
                  {rapport.nombreEnCarence}
                </p>
              </div>
            </div>

            {/* TABLEAU PRINCIPAL */}
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  {/* Ligne 1 : En-têtes années */}
                  <tr className="bg-blue-700 text-white">
                    <th rowSpan={2} className="px-2 py-2 border border-blue-600 text-center w-12">N°</th>
                    <th rowSpan={2} className="px-2 py-2 border border-blue-600 text-left w-32">NOM</th>
                    <th rowSpan={2} className="px-2 py-2 border border-blue-600 text-left w-40">PRENOMS</th>
                    <th rowSpan={2} className="px-2 py-2 border border-blue-600 text-center w-24">DATE AD</th>
                    {[annee - 1, annee, annee + 1].map((y) => (
                      <th
                        key={y}
                        colSpan={4}
                        className="px-2 py-2 border border-blue-600 text-center text-sm font-bold"
                      >
                        {y}
                      </th>
                    ))}
                    <th rowSpan={2} className="px-2 py-2 border border-blue-600 text-center w-20">État</th>
                  </tr>
                  {/* Ligne 2 : Trimestres */}
                  <tr className="bg-blue-600 text-white">
                    {[annee - 1, annee, annee + 1].map((y) =>
                      [1, 2, 3, 4].map((t) => (
                        <th
                          key={`${y}-T${t}`}
                          className="px-2 py-1 border border-blue-500 text-center w-16"
                        >
                          T{t}
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rapport.membres.map((membre) => (
                    <tr
                      key={membre.numero}
                      className="hover:bg-gray-50 border-b border-gray-200"
                    >
                      <td className="px-2 py-1 border border-gray-200 text-center font-medium">
                        {membre.numero}
                      </td>
                      <td className="px-2 py-1 border border-gray-200 font-semibold uppercase">
                        {membre.nom}
                      </td>
                      <td className="px-2 py-1 border border-gray-200">
                        {membre.prenoms}
                      </td>
                      <td className="px-2 py-1 border border-gray-200 text-center text-xs">
                        {formatDate(membre.dateAdhesion)}
                      </td>
                      {trimestres.map((tri) => {
                        const montant = membre.paiements[tri.key];
                        return (
                          <td
                            key={tri.key}
                            className="px-2 py-1 border border-gray-200 text-center text-blue-700 font-medium"
                          >
                            {montant ? formatMontant(montant) : ''}
                          </td>
                        );
                      })}
                      <td className="px-2 py-1 border border-gray-200 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            membre.etat === 'Oui'
                              ? 'bg-green-100 text-green-800'
                              : membre.etat === 'Non'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {membre.etat}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Ligne des totaux */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                    <td colSpan={4} className="px-2 py-2 border border-gray-300 text-right uppercase">
                      Totaux
                    </td>
                    {trimestres.map((tri) => {
                      const total = rapport.totaux[tri.key];
                      return (
                        <td
                          key={tri.key}
                          className="px-2 py-2 border border-gray-300 text-center text-green-700"
                        >
                          {total ? formatMontant(total) : ''}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 border border-gray-300 text-center font-bold text-blue-700">
                      {formatMontant(rapport.montantTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* LÉGENDE */}
            <div className="mt-4 flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-semibold">Oui</span>
                <span className="text-gray-600">À jour de ses cotisations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-semibold">Non</span>
                <span className="text-gray-600">Non à jour</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 font-semibold">Carence</span>
                <span className="text-gray-600">Période de carence (après adhésion)</span>
              </div>
            </div>

            {/* PIED DE PAGE */}
            <div className="mt-8 pt-4 border-t-2 border-gray-300">
              <div className="flex justify-between items-end text-xs text-gray-600">
                <div>
                  <p className="font-semibold text-gray-800">{rapport.mutuelle.nom}</p>
                  <p>Devise : {rapport.mutuelle.devise}</p>
                  <p>Montant total collecté : <span className="font-bold text-blue-700">{formatMontant(rapport.montantTotal)} {rapport.mutuelle.devise}</span></p>
                </div>
                <div className="text-right">
                  <p className="italic">Document généré automatiquement</p>
                  <p>Page 1/1</p>
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-16 text-xs text-gray-500">
                <div className="text-center">
                  <div className="border-b border-gray-400 w-32 mb-1"></div>
                  <p className="font-semibold">Le Président</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-400 w-32 mb-1"></div>
                  <p className="font-semibold">Le Trésorier</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-400 w-32 mb-1"></div>
                  <p className="font-semibold">Le Secrétaire</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message si pas encore de rapport */}
        {!rapport && !loading && !error && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center no-print">
            <p className="text-blue-800 text-lg">
              Sélectionnez une année et cliquez sur "Générer" pour créer le rapport
            </p>
          </div>
        )}
      </div>
    </>
  );
}