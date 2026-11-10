'use client';

import { useState } from 'react';
import api from '@/lib/api';

type RapportType = 'financier' | 'cotisations' | 'prestations' | 'dons' | 'ag';

export default function RapportsPage() {
  const [activeTab, setActiveTab] = useState<RapportType>('financier');
  const [loading, setLoading] = useState(false);
  const [rapportData, setRapportData] = useState<any>(null);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [dateDebut, setDateDebut] = useState(`${new Date().getFullYear()}-01-01`);
  const [dateFin, setDateFin] = useState(`${new Date().getFullYear()}-12-31`);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'financier', label: '📊 Rapport Financier' },
    { id: 'cotisations', label: '💰 Cotisations' },
    { id: 'prestations', label: '🎁 Prestations' },
    { id: 'dons', label: '💝 Dons' },
    { id: 'ag', label: '📋 Rapport AG' },
  ];

  const genererRapport = async () => {
    setLoading(true);
    setError('');
    setRapportData(null);

    try {
      let response;

      switch (activeTab) {
        case 'financier':
          response = await api.get(`/rapports/financier-annuel?annee=${annee}`);
          break;
        case 'cotisations':
          response = await api.get(`/rapports/cotisations?dateDebut=${dateDebut}&dateFin=${dateFin}`);
          break;
        case 'prestations':
          response = await api.get(`/rapports/prestations?dateDebut=${dateDebut}&dateFin=${dateFin}`);
          break;
        case 'dons':
          response = await api.get(`/rapports/dons?dateDebut=${dateDebut}&dateFin=${dateFin}`);
          break;
        case 'ag':
          response = await api.get(`/rapports/ag?annee=${annee}`);
          break;
      }

      setRapportData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la génération du rapport');
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant: number) => {
    return Number(montant || 0).toLocaleString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Rapports financiers</h1>
        <p className="text-gray-500 mt-1">
          Générez les rapports nécessaires pour les Assemblées Générales
        </p>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as RapportType);
                setRapportData(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {(activeTab === 'financier' || activeTab === 'ag') ? (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année
              </label>
              <select
                value={annee}
                onChange={(e) => setAnnee(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </>
          )}

          <button
            onClick={genererRapport}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Génération...' : 'Générer le rapport'}
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Résultats */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Génération du rapport en cours...
        </div>
      )}

      {/* Rapport Financier Annuel */}
      {rapportData && activeTab === 'financier' && (
        <div className="space-y-6">
          {/* Résumé */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <p className="text-green-100 mb-1">Total Recettes</p>
              <p className="text-3xl font-bold">{formatMontant(rapportData.resume.totalRecettes)} XOF</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
              <p className="text-red-100 mb-1">Total Dépenses</p>
              <p className="text-3xl font-bold">{formatMontant(rapportData.resume.totalDepenses)} XOF</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <p className="text-blue-100 mb-1">Solde</p>
              <p className="text-3xl font-bold">{formatMontant(rapportData.resume.solde)} XOF</p>
            </div>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cotisations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Cotisations</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total payées</span>
                  <span className="font-semibold text-green-600">
                    {formatMontant(rapportData.cotisations.totalPayees)} XOF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">En attente</span>
                  <span className="font-semibold text-yellow-600">
                    {formatMontant(rapportData.cotisations.totalEnAttente)} XOF
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Nombre de cotisations</span>
                  <span className="font-semibold">{rapportData.cotisations.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre payées</span>
                  <span className="font-semibold">{rapportData.cotisations.nombrePayees}</span>
                </div>
              </div>
            </div>

            {/* Prestations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🎁 Prestations</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total payées</span>
                  <span className="font-semibold text-green-600">
                    {formatMontant(rapportData.prestations.totalPayees)} XOF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">En attente</span>
                  <span className="font-semibold text-yellow-600">
                    {formatMontant(rapportData.prestations.totalEnAttente)} XOF
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Nombre de demandes</span>
                  <span className="font-semibold">{rapportData.prestations.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre payées</span>
                  <span className="font-semibold">{rapportData.prestations.nombrePayees}</span>
                </div>
              </div>
            </div>

            {/* Dons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💝 Dons</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total des dons</span>
                  <span className="font-semibold text-green-600">
                    {formatMontant(rapportData.dons.total)} XOF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre de dons</span>
                  <span className="font-semibold">{rapportData.dons.nombre}</span>
                </div>
              </div>
            </div>

            {/* Membres */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 Membres</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Membres actifs</span>
                  <span className="font-semibold">{rapportData.membres.totalActifs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nouveaux membres</span>
                  <span className="font-semibold">{rapportData.membres.nouveaux}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rapport Cotisations */}
      {rapportData && activeTab === 'cotisations' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Rapport des cotisations ({rapportData.periode.dateDebut} au {rapportData.periode.dateFin})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1">Payées</p>
              <p className="text-2xl font-bold text-green-800">
                {formatMontant(rapportData.parStatut.PAYEE.montant)} XOF
              </p>
              <p className="text-xs text-green-600">{rapportData.parStatut.PAYEE.nombre} cotisations</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700 mb-1">En attente</p>
              <p className="text-2xl font-bold text-yellow-800">
                {formatMontant(rapportData.parStatut.EN_ATTENTE.montant)} XOF
              </p>
              <p className="text-xs text-yellow-600">{rapportData.parStatut.EN_ATTENTE.nombre} cotisations</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-1">En retard</p>
              <p className="text-2xl font-bold text-red-800">
                {formatMontant(rapportData.parStatut.EN_RETARD.montant)} XOF
              </p>
              <p className="text-xs text-red-600">{rapportData.parStatut.EN_RETARD.nombre} cotisations</p>
            </div>
          </div>

          {/* Tableau détaillé */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Membre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rapportData.details.map((cot: any) => (
                  <tr key={cot.id}>
                    <td className="px-4 py-3 text-sm">
                      {cot.membre.prenom} {cot.membre.nom}
                    </td>
                    <td className="px-4 py-3 text-sm">{cot.typeCotisation.libelle}</td>
                    <td className="px-4 py-3 text-sm">{cot.periode}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatMontant(cot.montant)} XOF
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        cot.statut === 'PAYEE' ? 'bg-green-100 text-green-800' :
                        cot.statut === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {cot.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rapport Prestations */}
      {rapportData && activeTab === 'prestations' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Rapport des prestations ({rapportData.periode.dateDebut} au {rapportData.periode.dateFin})
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-800">{rapportData.parStatut.EN_ATTENTE}</p>
              <p className="text-xs text-yellow-600">En attente</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-800">{rapportData.parStatut.VALIDEE}</p>
              <p className="text-xs text-blue-600">Validées</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-800">{rapportData.parStatut.REJETEE}</p>
              <p className="text-xs text-red-600">Rejetées</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-800">{rapportData.parStatut.PAYEE}</p>
              <p className="text-xs text-green-600">Payées</p>
            </div>
          </div>

          {/* Par type */}
          <h4 className="font-semibold text-gray-800 mb-3">Répartition par type</h4>
          <div className="space-y-2">
            {Object.entries(rapportData.parType).map(([type, data]: [string, any]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{type}</span>
                <div className="text-right">
                  <p className="text-sm font-semibold">{data.nombre} demandes</p>
                  <p className="text-xs text-gray-500">{formatMontant(data.montant)} XOF</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rapport Dons */}
      {rapportData && activeTab === 'dons' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Rapport des dons ({rapportData.periode.dateDebut} au {rapportData.periode.dateFin})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-700 mb-1">Total des dons</p>
              <p className="text-2xl font-bold text-purple-800">
                {formatMontant(rapportData.totalMontant)} XOF
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">Nombre de dons</p>
              <p className="text-2xl font-bold text-blue-800">{rapportData.total}</p>
            </div>
          </div>

          {/* Tableau détaillé */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Structure</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rapportData.details.map((don: any) => (
                  <tr key={don.id}>
                    <td className="px-4 py-3 text-sm">{don.structureDonatrice}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatMontant(don.montant)} XOF
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(don.dateDon).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm">{don.modePaiement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rapport AG */}
      {rapportData && activeTab === 'ag' && (
        <div className="space-y-6">
          {/* En-tête du rapport */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                {rapportData.mutuelle.nom}
              </h2>
              <p className="text-lg text-gray-600 mt-2">
                Rapport Général - Assemblée Générale {rapportData.annee}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Généré le {new Date(rapportData.dateGeneration).toLocaleDateString('fr-FR')}
              </p>
            </div>

            {/* Résumé financier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700 mb-1">Recettes totales</p>
                <p className="text-xl font-bold text-green-800">
                  {formatMontant(rapportData.rapportFinancier.resume.totalRecettes)} {rapportData.mutuelle.devise}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-sm text-red-700 mb-1">Dépenses totales</p>
                <p className="text-xl font-bold text-red-800">
                  {formatMontant(rapportData.rapportFinancier.resume.totalDepenses)} {rapportData.mutuelle.devise}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-700 mb-1">Solde de l'exercice</p>
                <p className="text-xl font-bold text-blue-800">
                  {formatMontant(rapportData.rapportFinancier.resume.solde)} {rapportData.mutuelle.devise}
                </p>
              </div>
            </div>

            {/* Statistiques membres */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 Effectifs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Membres actifs</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {rapportData.rapportFinancier.membres.totalActifs}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Nouveaux membres</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {rapportData.rapportFinancier.membres.nouveaux}
                  </p>
                </div>
              </div>
            </div>

            {/* Activités de l'année */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Activités de l'année</h3>
              {rapportData.activites.length === 0 ? (
                <p className="text-gray-500">Aucune activité enregistrée</p>
              ) : (
                <div className="space-y-2">
                  {rapportData.activites.map((activite: any) => (
                    <div key={activite.id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{activite.titre}</p>
                        <p className="text-sm text-gray-500">{activite.lieu}</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(activite.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bouton imprimer */}
          <div className="flex justify-center">
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>🖨️</span>
              <span>Imprimer le rapport</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}