'use client';

import { useState, useRef } from 'react';
import api from '@/lib/api';
import { toast } from '@/store/toast-store';

interface ImportMembresModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MembrePreview {
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  dateAdhesion: string;
  paiements: string[];
}

export default function ImportMembresModal({ isOpen, onClose, onSuccess }: ImportMembresModalProps) {
  const [membres, setMembres] = useState<MembrePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Parser un fichier CSV
  const parseCSV = (text: string): MembrePreview[] => {
    const lines = text.trim().split('\n');
    const parsed: MembrePreview[] = [];

    // Ignorer la ligne d'en-tête si elle existe
    const startIndex = lines[0]?.toLowerCase().includes('nom') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parser avec gestion des guillemets
      const columns: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      columns.push(current.trim());

      if (columns.length >= 5) {
        parsed.push({
          nom: columns[0],
          prenom: columns[1],
          sexe: columns[2] || 'M',
          dateNaissance: columns[3] || '1990-01-01',
          dateAdhesion: columns[4],
          paiements: columns[5] ? columns[5].split(';').filter(p => p.trim()) : [],
        });
      }
    }

    return parsed;
  };

  // Handler pour l'upload de fichier
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setMembres(parsed);
      setLoading(false);
      setResult(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Handler pour le coller de données
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (text) {
      e.preventDefault();
      const parsed = parseCSV(text);
      setMembres(parsed);
      setResult(null);
    }
  };

  // Lancer l'import
  const handleImport = async () => {
    if (membres.length === 0) {
      toast.error('Erreur', 'Aucun membre à importer');
      return;
    }

    setImporting(true);
    try {
      const response = await api.post('/membres/import', { membres });
      setResult(response.data);
      
      if (response.data.importes > 0) {
        toast.success(
          'Import réussi',
          `${response.data.importes} membre(s) importé(s) sur ${response.data.total}`
        );
        onSuccess();
      } else {
        toast.warning('Aucun import', 'Tous les membres existent déjà');
      }
    } catch (error: any) {
      toast.error('Erreur', error.response?.data?.message || 'Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setMembres([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
        {/* En-tête */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            📥 Importer des membres
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Format du fichier CSV attendu</h3>
            <p className="text-sm text-blue-700 mb-2">
              Colonnes : <code className="bg-blue-100 px-1 rounded">nom, prenom, sexe, date_adhesion, paiements</code>
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>sexe</strong> : M ou F (optionnel, M par défaut)</li>
              <li>• <strong>date_adhesion</strong> : format YYYY-MM-DD</li>
              <li>• <strong>paiements</strong> : périodes YYYY-MM séparées par <code>;</code> (entre guillemets)</li>
              <li>• Le droit d'adhésion de 5000 FCFA est créé automatiquement</li>
            </ul>
            <div className="mt-2 p-2 bg-white rounded font-mono text-xs overflow-x-auto">
              nom,prenom,sexe,date_adhesion,paiements<br/>
              ABE,Abe Laurent,M,2026-01-12,"2026-01;2026-04;2026-07"
            </div>
          </div>

          {/* Zone d'upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload fichier */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📁</div>
                <p className="font-medium text-gray-700">Choisir un fichier CSV</p>
                <p className="text-sm text-gray-500">Cliquez ou glissez-déposez</p>
              </label>
            </div>

            {/* Zone de collage */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Ou collez les données CSV ici :
              </p>
              <textarea
                onPaste={handlePaste}
                placeholder="Collez vos données CSV ici..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                readOnly
              />
            </div>
          </div>

          {/* Prévisualisation */}
          {membres.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">
                  👀 Prévisualisation ({membres.length} membre(s))
                </h3>
                <button
                  onClick={resetImport}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  🗑️ Réinitialiser
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">#</th>
                        <th className="px-4 py-2 text-left">Nom</th>
                        <th className="px-4 py-2 text-left">Prénom</th>
                        <th className="px-4 py-2 text-center">Sexe</th>
                        <th className="px-4 py-2 text-left">Adhésion</th>
                        <th className="px-4 py-2 text-center">Paiements</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {membres.map((m, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-2 font-medium uppercase">{m.nom}</td>
                          <td className="px-4 py-2">{m.prenom}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              m.sexe === 'F' 
                                ? 'bg-pink-100 text-pink-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {m.sexe === 'F' ? 'F' : 'M'}
                            </span>
                          </td>
                          <td className="px-4 py-2">{m.dateAdhesion}</td>
                          <td className="px-4 py-2 text-center">
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                              {m.paiements.length}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {(5000 + m.paiements.length * 10000).toLocaleString()} F
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Résumé */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded">
                  <p className="text-xs text-gray-600">Membres à importer</p>
                  <p className="text-xl font-bold text-blue-800">{membres.length}</p>
                </div>
                <div className="bg-green-50 border-l-4 border-green-600 p-3 rounded">
                  <p className="text-xs text-gray-600">Cotisations à créer</p>
                  <p className="text-xl font-bold text-green-800">
                    {membres.length + membres.reduce((s, m) => s + m.paiements.length, 0)}
                  </p>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-600 p-3 rounded">
                  <p className="text-xs text-gray-600">Montant total</p>
                  <p className="text-xl font-bold text-purple-800">
                    {membres.reduce((s, m) => s + 5000 + m.paiements.length * 10000, 0).toLocaleString()} F
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Résultat de l'import */}
          {result && (
            <div className={`border rounded-lg p-4 ${
              result.importes > 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="font-semibold mb-2">
                {result.importes > 0 ? '✅ Import réussi' : '⚠️ Résultat de l\'import'}
              </h3>
              <ul className="text-sm space-y-1">
                <li>• Total : <strong>{result.total}</strong></li>
                <li>• Importés : <strong className="text-green-700">{result.importes}</strong></li>
                <li>• Ignorés (doublons) : <strong className="text-yellow-700">{result.ignores}</strong></li>
              </ul>
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
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Fermer
          </button>
          {membres.length > 0 && !result && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {importing ? 'Import en cours...' : `📥 Importer ${membres.length} membre(s)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}