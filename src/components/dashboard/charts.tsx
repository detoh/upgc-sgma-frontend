'use client';

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = {
  vert: '#10b981',
  rouge: '#ef4444',
  bleu: '#3b82f6',
  orange: '#f59e0b',
  violet: '#8b5cf6',
  gris: '#6b7280',
};

const COLORS_PIE = ['#10b981', '#ef4444'];

// ==========================================
// GRAPHIQUE 1 : Répartition À jour / En retard
// ==========================================
export function GraphiqueRepartition({ membresAJour, membresEnRetard }: { membresAJour: number; membresEnRetard: number }) {
  const data = [
    { name: 'À jour', value: membresAJour },
    { name: 'En retard', value: membresEnRetard },
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => [`${value} membres`, '']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==========================================
// GRAPHIQUE 2 : Encaissements par mois
// ==========================================
export function GraphiqueEncaissements({ data }: { data: Array<{ mois: string; montant: number }> }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mois" />
          <YAxis />
          <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} XOF`, 'Montant']} />
          <Bar dataKey="montant" fill={COLORS.bleu} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==========================================
// GRAPHIQUE 3 : Top 10 des membres en retard
// ==========================================
export function GraphiqueTop10Retard({ data }: { data: Array<{ nom: string; prenom: string; montantDu: number }> }) {
  const chartData = data.map(m => ({
    nom: `${m.prenom} ${m.nom}`,
    montantDu: m.montantDu,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="nom" width={150} />
          <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} XOF`, 'Montant dû']} />
          <Bar dataKey="montantDu" fill={COLORS.rouge} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==========================================
// GRAPHIQUE 4 : Répartition des cotisations par type
// ==========================================
export function GraphiqueRepartitionCotisations({ data }: { data: Array<{ nom: string; total: number }> }) {
  const COLORS_MULTIPLE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ nom, percent }: any) => `${nom}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="total"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS_MULTIPLE[index % COLORS_MULTIPLE.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} XOF`, 'Total']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}