/**
 * Resultados (Pestaña 9 del Excel MITECO)
 * 
 * Resumen de todas las emisiones: Alcance 1 (combustión, vehículos, fugitivas, proceso)
 * y Alcance 2 (electricidad). Con gráficos de distribución y tabla-resumen.
 */

'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Resultados {
  alcance1_combustion_fija: number;
  alcance1_combustion_movil: number;
  alcance1_fugitivas: number;
  alcance1_proceso: number;
  total_alcance1: number;
  alcance2_electricidad: number;
  total_alcance2: number;
  total_emisiones: number;
  ratio_por_empleado: number;
  ratio_por_superficie: number;
}

const EMPTY: Resultados = {
  alcance1_combustion_fija: 0,
  alcance1_combustion_movil: 0,
  alcance1_fugitivas: 0,
  alcance1_proceso: 0,
  total_alcance1: 0,
  alcance2_electricidad: 0,
  total_alcance2: 0,
  total_emisiones: 0,
  ratio_por_empleado: 0,
  ratio_por_superficie: 0,
};

const COLORS = ['#16a34a', '#22c55e', '#86efac', '#a3e635', '#3b82f6', '#60a5fa'];

export default function ResultadosPage() {
  const [results, setResults] = useState<Resultados>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState('');
  
  const loadResults = () => {
    fetch('/api/data?tipo=resultados&orgId=org_001&anio=2024')
      .then(r => r.json())
      .then(d => {
        if (d) setResults({ ...EMPTY, ...d });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  
  useEffect(() => { loadResults(); }, []);
  
  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: 'org_001', anio: 2024 }),
      });
      if (res.ok) {
        setMessage('✅ Recálculo completado');
        loadResults();
      } else {
        setMessage('❌ Error en recálculo');
      }
    } catch {
      setMessage('❌ Error de conexión');
    }
    setRecalculating(false);
  };
  
  const pieData = [
    { name: 'Combustión fija', value: results.alcance1_combustion_fija },
    { name: 'Vehículos', value: results.alcance1_combustion_movil },
    { name: 'Fugitivas', value: results.alcance1_fugitivas },
    { name: 'Proceso', value: results.alcance1_proceso },
    { name: 'Electricidad', value: results.alcance2_electricidad },
  ].filter(d => d.value > 0);
  
  const barData = [
    { name: 'Alcance 1', value: results.total_alcance1 },
    { name: 'Alcance 2', value: results.total_alcance2 },
  ];
  
  const rows = [
    { cat: 'Combustión fija (instalaciones)', scope: 'Alcance 1', value: results.alcance1_combustion_fija, icon: '🔥' },
    { cat: 'Combustión móvil (vehículos)', scope: 'Alcance 1', value: results.alcance1_combustion_movil, icon: '🚗' },
    { cat: 'Emisiones fugitivas', scope: 'Alcance 1', value: results.alcance1_fugitivas, icon: '❄️' },
    { cat: 'Emisiones de proceso', scope: 'Alcance 1', value: results.alcance1_proceso, icon: '🏭' },
    { cat: 'Consumo eléctrico', scope: 'Alcance 2', value: results.alcance2_electricidad, icon: '⚡' },
  ];
  
  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Resultados</h1>
          <p className="text-gray-500 mt-1">Resumen de emisiones GEI · Año 2024</p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="btn-primary flex items-center gap-2"
        >
          {recalculating ? '⏳ Recalculando...' : '🔄 Recalcular todo'}
        </button>
      </div>
      
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">×</button>
        </div>
      )}
      
      {loading ? (
        <p className="text-gray-400 py-16 text-center text-lg">Cargando resultados...</p>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="kpi-card border-l-4 border-green-600">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Emisiones</p>
              <p className="text-3xl font-bold text-gray-900">{results.total_emisiones.toFixed(2)}</p>
              <p className="text-sm text-gray-500">t CO₂e</p>
            </div>
            <div className="kpi-card border-l-4 border-emerald-500">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Alcance 1</p>
              <p className="text-3xl font-bold text-green-700">{results.total_alcance1.toFixed(2)}</p>
              <p className="text-sm text-gray-500">t CO₂e</p>
            </div>
            <div className="kpi-card border-l-4 border-blue-500">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Alcance 2</p>
              <p className="text-3xl font-bold text-blue-700">{results.total_alcance2.toFixed(2)}</p>
              <p className="text-sm text-gray-500">t CO₂</p>
            </div>
            <div className="kpi-card border-l-4 border-amber-500">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Ratio / Empleado</p>
              <p className="text-3xl font-bold text-amber-700">{results.ratio_por_empleado.toFixed(2)}</p>
              <p className="text-sm text-gray-500">t CO₂e / empleado</p>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Emisiones por Alcance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v) => `${Number(v).toFixed(2)} t CO₂e`} />
                  <Bar dataKey="value" fill="#16a34a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Distribución por categoría</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${Number(v).toFixed(4)} t CO₂e`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-16">Sin datos para mostrar</p>
              )}
            </div>
          </div>
          
          {/* Detailed table */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Desglose detallado</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Categoría</th>
                  <th>Alcance</th>
                  <th>t CO₂e</th>
                  <th>% del Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="text-center">{r.icon}</td>
                    <td>{r.cat}</td>
                    <td><span className={`badge-${r.scope === 'Alcance 1' ? 'green' : 'blue'}`}>{r.scope}</span></td>
                    <td className="text-right font-semibold">{r.value.toFixed(4)}</td>
                    <td className="text-right text-gray-500">
                      {results.total_emisiones > 0 ? ((r.value / results.total_emisiones) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td></td>
                  <td>TOTAL</td>
                  <td></td>
                  <td className="text-right text-green-700">{results.total_emisiones.toFixed(4)}</td>
                  <td className="text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
