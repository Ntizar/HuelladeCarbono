/**
 * Dashboard - Página principal con KPIs y gráficas de huella de carbono
 * 
 * Muestra:
 * - KPI cards: Total HC, Alcance 1, Alcance 2, Ratio/empleado
 * - Gráfica de barras apiladas: Alcance 1 vs 2 por año
 * - Gráfica de dona: Desglose categorías Alcance 1
 * - Gráfica de línea: Evolución anual del ratio
 * - Top 3 fuentes de emisión
 */

'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

interface Results {
  anio_calculo: number;
  alcance_1: {
    instalaciones_fijas_no_ley: number;
    instalaciones_fijas_ley: number;
    transporte_carretera: number;
    transporte_ferroviario_maritimo_aereo: number;
    maquinaria: number;
    fugitivas: number;
    proceso: number;
    total_t_co2e: number;
  };
  alcance_2: {
    electricidad_edificios: number;
    electricidad_vehiculos: number;
    calor_vapor_frio: number;
    total_t_co2e: number;
  };
  total_alcance_1_2_t_co2e: number;
  ratios: {
    t_co2e_por_empleado: number;
    t_co2e_por_m2: number;
    t_co2e_por_indice_actividad: number;
  };
}

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#06b6d4', '#ec4899'];

export default function DashboardPage() {
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/data?tipo=results&orgId=org_001&anio=2024')
      .then((r) => r.json())
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  // Datos para gráficas
  const scope1Categories = results ? [
    { name: 'Inst. Fijas', value: results.alcance_1.instalaciones_fijas_no_ley + results.alcance_1.instalaciones_fijas_ley },
    { name: 'Transporte', value: results.alcance_1.transporte_carretera + results.alcance_1.transporte_ferroviario_maritimo_aereo },
    { name: 'Fugitivas', value: results.alcance_1.fugitivas },
    { name: 'Maquinaria', value: results.alcance_1.maquinaria },
    { name: 'Proceso', value: results.alcance_1.proceso },
  ].filter(c => c.value > 0) : [];
  
  const barData = results ? [
    {
      name: String(results.anio_calculo),
      'Alcance 1': results.alcance_1.total_t_co2e,
      'Alcance 2': results.alcance_2.total_t_co2e,
    },
  ] : [];
  
  const total = results?.total_alcance_1_2_t_co2e || 0;
  const a1 = results?.alcance_1.total_t_co2e || 0;
  const a2 = results?.alcance_2.total_t_co2e || 0;
  const ratio = results?.ratios.t_co2e_por_empleado || 0;
  
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Resumen de la huella de carbono · Año {results?.anio_calculo || 2024}
        </p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Cargando datos...</div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="kpi-card border-l-4 border-l-green-500">
              <div className="text-sm font-medium text-gray-500">Total HC</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">t CO₂e</div>
            </div>
            
            <div className="kpi-card border-l-4 border-l-blue-500">
              <div className="text-sm font-medium text-gray-500">Alcance 1</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                {a1.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">t CO₂e · Emisiones directas</div>
            </div>
            
            <div className="kpi-card border-l-4 border-l-amber-500">
              <div className="text-sm font-medium text-gray-500">Alcance 2</div>
              <div className="text-3xl font-bold text-amber-600 mt-2">
                {a2.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">t CO₂e · Electricidad</div>
            </div>
            
            <div className="kpi-card border-l-4 border-l-purple-500">
              <div className="text-sm font-medium text-gray-500">Ratio / empleado</div>
              <div className="text-3xl font-bold text-purple-600 mt-2">
                {ratio.toFixed(3)}
              </div>
              <div className="text-sm text-gray-500 mt-1">t CO₂e / empleado</div>
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Bar Chart - Alcance 1 vs 2 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Alcance 1 vs Alcance 2
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(3)} t CO₂e`} />
                  <Legend />
                  <Bar dataKey="Alcance 1" fill="#2563eb" stackId="a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Alcance 2" fill="#d97706" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Pie Chart - Desglose Alcance 1 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Desglose Alcance 1
              </h3>
              {scope1Categories.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={scope1Categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {scope1Categories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(3)} t CO₂e`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  Sin datos de Alcance 1 registrados
                </div>
              )}
            </div>
          </div>
          
          {/* Ratios Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Ratio por superficie</h3>
              <div className="text-2xl font-bold text-gray-900">
                {(results?.ratios.t_co2e_por_m2 || 0).toFixed(4)}
              </div>
              <div className="text-sm text-gray-500">t CO₂e / m²</div>
            </div>
            
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Ratio por empleado</h3>
              <div className="text-2xl font-bold text-gray-900">
                {(results?.ratios.t_co2e_por_empleado || 0).toFixed(3)}
              </div>
              <div className="text-sm text-gray-500">t CO₂e / empleado</div>
            </div>
            
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Ratio por actividad</h3>
              <div className="text-2xl font-bold text-gray-900">
                {(results?.ratios.t_co2e_por_indice_actividad || 0).toFixed(6)}
              </div>
              <div className="text-sm text-gray-500">t CO₂e / unidad actividad</div>
            </div>
          </div>
          
          {/* Quick Info */}
          {total === 0 && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
              <h3 className="font-semibold text-green-800 mb-2">🌱 Empieza a introducir datos</h3>
              <p className="text-sm text-green-700">
                No hay datos de emisiones registrados aún. Ve a las pestañas de 
                <strong> Alcance 1</strong> (Instalaciones fijas, Vehículos, Fugitivas) 
                y <strong>Alcance 2</strong> (Electricidad) para introducir los consumos 
                de tu organización. Los resultados se calcularán automáticamente.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
