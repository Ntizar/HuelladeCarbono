/**
 * Dashboard - Panel avanzado de huella de carbono
 * 
 * Filtros: Año, Sede, Alcance, Tipo contaminante
 * KPIs: Total HC, Alcance 1, Alcance 2, Ratio/empleado, % por gas
 * Gráficas: Barras apiladas, dona desglose, tabla top emisores, por sede
 * Datos granulares: Lee los consumos individuales para desglose por sede/tipo
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

/* ─── Tipos ─── */

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

interface RawItem {
  sede?: string;
  centro_trabajo?: string;
  combustible?: string;
  categoria_vehiculo?: string;
  gas_refrigerante?: string;
  comercializadora?: string;
  emisiones_totales_kg_co2e?: number;
  emisiones_kg_co2e?: number;
  emisiones_kg_co2?: number;
  emisiones_parciales?: { co2_kg?: number; ch4_g?: number; n2o_g?: number };
  cantidad?: number;
  kwh_consumidos?: number;
  recarga_kg?: number;
  [key: string]: unknown;
}

interface AllRaw {
  scope1_instalaciones_fijas?: { no_sujetas_ley_1_2005?: RawItem[]; sujetas_ley_1_2005?: RawItem[] };
  scope1_vehiculos?: { transporte_carretera_A1_combustible?: RawItem[]; transporte_carretera_A2_distancia_km?: RawItem[]; maquinaria_movil?: RawItem[] };
  scope1_fugitivas?: { climatizacion_refrigeracion?: RawItem[]; otros?: RawItem[] };
  scope2_electricidad?: { electricidad_edificios?: RawItem[]; electricidad_vehiculos?: RawItem[]; calor_vapor_frio?: RawItem[] };
}

interface Sede { id: string; nombre: string; direccion?: string }

/* ─── Constantes ─── */

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#06b6d4', '#ec4899', '#f43f5e', '#84cc16', '#14b8a6'];
const ANIOS = Array.from({ length: 2027 - 2007 + 1 }, (_, i) => 2027 - i);

type AlcanceFilter = 'todos' | 'alcance1' | 'alcance2';
type GasFilter = 'todos' | 'co2' | 'ch4' | 'n2o';

/* ─── Helpers ─── */

function getItemSede(item: RawItem): string {
  return item.sede || item.centro_trabajo || 'Sin sede';
}

function getItemEmissions(item: RawItem): number {
  return (item.emisiones_totales_kg_co2e || item.emisiones_kg_co2e || item.emisiones_kg_co2 || 0) / 1000;
}

function getItemLabel(item: RawItem, section: string): string {
  if (item.combustible) return item.combustible;
  if (item.categoria_vehiculo) return item.categoria_vehiculo;
  if (item.gas_refrigerante) return item.gas_refrigerante;
  if (item.comercializadora) return item.comercializadora;
  return section;
}

/* ─── Normalizar todos los items crudos ─── */

interface NormalizedItem {
  sede: string;
  section: string;
  alcance: 'alcance1' | 'alcance2';
  label: string;
  t_co2e: number;
  co2_kg: number;
  ch4_g: number;
  n2o_g: number;
}

function normalizeRawData(raw: AllRaw): NormalizedItem[] {
  const items: NormalizedItem[] = [];

  const push = (list: RawItem[] | undefined, section: string, alcance: 'alcance1' | 'alcance2') => {
    (list || []).forEach((item) => {
      items.push({
        sede: getItemSede(item),
        section,
        alcance,
        label: getItemLabel(item, section),
        t_co2e: getItemEmissions(item),
        co2_kg: item.emisiones_parciales?.co2_kg || 0,
        ch4_g: item.emisiones_parciales?.ch4_g || 0,
        n2o_g: item.emisiones_parciales?.n2o_g || 0,
      });
    });
  };

  push(raw.scope1_instalaciones_fijas?.no_sujetas_ley_1_2005, 'Inst. Fijas', 'alcance1');
  push(raw.scope1_instalaciones_fijas?.sujetas_ley_1_2005, 'Inst. Fijas (Ley)', 'alcance1');
  push(raw.scope1_vehiculos?.transporte_carretera_A1_combustible, 'Vehículos', 'alcance1');
  push(raw.scope1_vehiculos?.transporte_carretera_A2_distancia_km, 'Vehículos (km)', 'alcance1');
  push(raw.scope1_vehiculos?.maquinaria_movil, 'Maquinaria', 'alcance1');
  push(raw.scope1_fugitivas?.climatizacion_refrigeracion, 'Fugitivas', 'alcance1');
  push(raw.scope1_fugitivas?.otros, 'Fugitivas (otros)', 'alcance1');
  push(raw.scope2_electricidad?.electricidad_edificios, 'Electricidad', 'alcance2');
  push(raw.scope2_electricidad?.electricidad_vehiculos, 'Elec. Vehículos', 'alcance2');
  push(raw.scope2_electricidad?.calor_vapor_frio, 'Calor/Vapor/Frío', 'alcance2');

  return items;
}

/* ─── Componente ─── */

export default function DashboardPage() {
  const [results, setResults] = useState<Results | null>(null);
  const [rawItems, setRawItems] = useState<NormalizedItem[]>([]);
  const [_sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [anio, setAnio] = useState(2024);
  const [filterSede, setFilterSede] = useState('todas');
  const [filterAlcance, setFilterAlcance] = useState<AlcanceFilter>('todos');
  const [filterGas, setFilterGas] = useState<GasFilter>('todos');

  const orgId = 'org_001';

  const loadData = useCallback(async (year: number) => {
    setLoading(true);
    try {
      const [resResults, resRaw, resSedes] = await Promise.all([
        fetch(`/api/data?tipo=results&orgId=${orgId}&anio=${year}`),
        fetch(`/api/data?tipo=all_raw&orgId=${orgId}&anio=${year}`),
        fetch(`/api/data?tipo=sedes&orgId=${orgId}&anio=${year}`),
      ]);
      const [dataResults, dataRaw, dataSedes] = await Promise.all([
        resResults.json().catch(() => null),
        resRaw.json().catch(() => ({})),
        resSedes.json().catch(() => ({ sedes: [] })),
      ]);
      setResults(dataResults);
      setRawItems(normalizeRawData(dataRaw || {}));
      setSedes(dataSedes?.sedes || []);
    } catch {
      setResults(null);
      setRawItems([]);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    loadData(anio);
  }, [anio, loadData]);

  /* ─── Datos filtrados ─── */

  const filtered = useMemo(() => {
    let items = rawItems;
    if (filterSede !== 'todas') items = items.filter(i => i.sede === filterSede);
    if (filterAlcance !== 'todos') items = items.filter(i => i.alcance === filterAlcance);
    return items;
  }, [rawItems, filterSede, filterAlcance]);

  const totalFiltered = useMemo(() =>
    filtered.reduce((sum, i) => sum + i.t_co2e, 0),
  [filtered]);

  /* ─── Datos derivados para gráficas ─── */

  const sedeNames = useMemo(() => {
    const names = new Set(rawItems.map(i => i.sede));
    return Array.from(names).sort();
  }, [rawItems]);

  // Desglose por categoría
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(i => {
      map[i.section] = (map[i.section] || 0) + i.t_co2e;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Desglose por sede
  const sedeBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(i => {
      map[i.sede] = (map[i.sede] || 0) + i.t_co2e;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Desglose por contaminante (CO₂, CH₄, N₂O)
  const gasBreakdown = useMemo(() => {
    let totalCO2 = 0, totalCH4 = 0, totalN2O = 0;
    filtered.forEach(i => {
      totalCO2 += i.co2_kg;
      totalCH4 += i.ch4_g * 27.9 / 1000; // a kg CO₂e
      totalN2O += i.n2o_g * 273 / 1000; // a kg CO₂e
    });
    return [
      { name: 'CO₂', value: totalCO2 / 1000, color: '#2563eb' },
      { name: 'CH₄', value: totalCH4 / 1000, color: '#d97706' },
      { name: 'N₂O', value: totalN2O / 1000, color: '#dc2626' },
    ].filter(g => g.value > 0);
  }, [filtered]);

  // Top emisores
  const topEmitters = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(i => {
      const key = `${i.label} (${i.sede})`;
      map[key] = (map[key] || 0) + i.t_co2e;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // Bar data: Alcance 1 vs 2
  const barData = useMemo(() => {
    if (!results) return [];
    const a1 = filterAlcance === 'alcance2' ? 0 : (filterSede === 'todas'
      ? results.alcance_1.total_t_co2e
      : filtered.filter(i => i.alcance === 'alcance1').reduce((s, i) => s + i.t_co2e, 0));
    const a2 = filterAlcance === 'alcance1' ? 0 : (filterSede === 'todas'
      ? results.alcance_2.total_t_co2e
      : filtered.filter(i => i.alcance === 'alcance2').reduce((s, i) => s + i.t_co2e, 0));
    return [{ name: String(anio), 'Alcance 1': a1, 'Alcance 2': a2 }];
  }, [results, filtered, filterAlcance, filterSede, anio]);

  // KPIs
  const total = filterSede === 'todas' && filterAlcance === 'todos'
    ? (results?.total_alcance_1_2_t_co2e || 0) : totalFiltered;
  const a1 = filterSede === 'todas' && filterAlcance !== 'alcance2'
    ? (results?.alcance_1.total_t_co2e || 0) : filtered.filter(i => i.alcance === 'alcance1').reduce((s, i) => s + i.t_co2e, 0);
  const a2 = filterSede === 'todas' && filterAlcance !== 'alcance1'
    ? (results?.alcance_2.total_t_co2e || 0) : filtered.filter(i => i.alcance === 'alcance2').reduce((s, i) => s + i.t_co2e, 0);
  const ratio = results?.ratios.t_co2e_por_empleado || 0;

  const pctA1 = total > 0 ? ((a1 / total) * 100).toFixed(0) : '0';
  const pctA2 = total > 0 ? ((a2 / total) * 100).toFixed(0) : '0';

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Panel de control · Huella de carbono
          </p>
        </div>
        <p className="text-xs text-gray-400">Desarrollado por David Antizar</p>
      </div>

      {/* ─── Filtros ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
        {/* Año */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Año</label>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="form-select text-sm w-full"
          >
            {ANIOS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Sede */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Sede</label>
          <select
            value={filterSede}
            onChange={(e) => setFilterSede(e.target.value)}
            className="form-select text-sm w-full"
          >
            <option value="todas">Todas las sedes</option>
            {sedeNames.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Alcance */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Alcance</label>
          <select
            value={filterAlcance}
            onChange={(e) => setFilterAlcance(e.target.value as AlcanceFilter)}
            className="form-select text-sm w-full"
          >
            <option value="todos">Alcance 1+2</option>
            <option value="alcance1">Solo Alcance 1</option>
            <option value="alcance2">Solo Alcance 2</option>
          </select>
        </div>

        {/* Gas */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Contaminante</label>
          <select
            value={filterGas}
            onChange={(e) => setFilterGas(e.target.value as GasFilter)}
            className="form-select text-sm w-full"
          >
            <option value="todos">Todos los GEI</option>
            <option value="co2">CO₂</option>
            <option value="ch4">CH₄</option>
            <option value="n2o">N₂O</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400 animate-pulse">Cargando datos...</div>
        </div>
      ) : (
        <>
          {/* ─── KPI Cards ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="kpi-card border-l-4 border-l-green-500">
              <div className="text-xs font-medium text-gray-500">Total HC</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{total.toFixed(2)}</div>
              <div className="text-xs text-gray-500">t CO₂e</div>
            </div>
            <div className="kpi-card border-l-4 border-l-blue-500">
              <div className="text-xs font-medium text-gray-500">Alcance 1</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{a1.toFixed(2)}</div>
              <div className="text-xs text-gray-500">{pctA1}% · Directas</div>
            </div>
            <div className="kpi-card border-l-4 border-l-amber-500">
              <div className="text-xs font-medium text-gray-500">Alcance 2</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{a2.toFixed(2)}</div>
              <div className="text-xs text-gray-500">{pctA2}% · Electricidad</div>
            </div>
            <div className="kpi-card border-l-4 border-l-purple-500">
              <div className="text-xs font-medium text-gray-500">Ratio / empleado</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">{ratio.toFixed(3)}</div>
              <div className="text-xs text-gray-500">t CO₂e / emp.</div>
            </div>
            <div className="kpi-card border-l-4 border-l-teal-500">
              <div className="text-xs font-medium text-gray-500">Registros</div>
              <div className="text-2xl font-bold text-teal-600 mt-1">{filtered.length}</div>
              <div className="text-xs text-gray-500">consumos cargados</div>
            </div>
          </div>

          {/* ─── Charts Row 1 ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Bar Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alcance 1 vs Alcance 2</h3>
              <ResponsiveContainer width="100%" height={280}>
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

            {/* Pie - Desglose por categoría */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Desglose por categoría</h3>
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {categoryBreakdown.map((_, i) => (
                        <Cell key={`cat-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(3)} t CO₂e`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-gray-400">Sin datos</div>
              )}
            </div>
          </div>

          {/* ─── Charts Row 2 ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pie - Desglose por sede */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Emisiones por sede</h3>
              {sedeBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={sedeBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {sedeBreakdown.map((_, i) => (
                        <Cell key={`sede-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(3)} t CO₂e`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-gray-400">Sin sedes registradas</div>
              )}
            </div>

            {/* Pie - Desglose por gas */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Emisiones por contaminante</h3>
              {gasBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={gasBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {gasBreakdown.map((entry, i) => (
                        <Cell key={`gas-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(3)} t CO₂e`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-gray-400">Sin datos de gases</div>
              )}
            </div>
          </div>

          {/* ─── Top emisores + Ratios ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Top Emisores tabla */}
            <div className="card lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top fuentes de emisión</h3>
              {topEmitters.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">#</th>
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">Fuente</th>
                        <th className="text-right py-2 px-3 text-gray-500 font-medium">t CO₂e</th>
                        <th className="text-right py-2 px-3 text-gray-500 font-medium">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topEmitters.map((e, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                          <td className="py-2 px-3 font-medium text-gray-900">{e.name}</td>
                          <td className="py-2 px-3 text-right text-gray-700">{e.value.toFixed(3)}</td>
                          <td className="py-2 px-3 text-right text-gray-500">
                            {total > 0 ? ((e.value / total) * 100).toFixed(1) : '0'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">Sin emisiones registradas</div>
              )}
            </div>

            {/* Ratios */}
            <div className="space-y-4">
              <div className="card">
                <h3 className="text-xs font-medium text-gray-500 mb-1">t CO₂e / m²</h3>
                <div className="text-2xl font-bold text-gray-900">
                  {(results?.ratios.t_co2e_por_m2 || 0).toFixed(4)}
                </div>
              </div>
              <div className="card">
                <h3 className="text-xs font-medium text-gray-500 mb-1">t CO₂e / empleado</h3>
                <div className="text-2xl font-bold text-gray-900">
                  {(results?.ratios.t_co2e_por_empleado || 0).toFixed(3)}
                </div>
              </div>
              <div className="card">
                <h3 className="text-xs font-medium text-gray-500 mb-1">t CO₂e / actividad</h3>
                <div className="text-2xl font-bold text-gray-900">
                  {(results?.ratios.t_co2e_por_indice_actividad || 0).toFixed(6)}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Barra horizontal por sede ─── */}
          {sedeBreakdown.length > 1 && (
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparativa por sede</h3>
              <ResponsiveContainer width="100%" height={Math.max(180, sedeBreakdown.length * 45)}>
                <BarChart data={sedeBreakdown} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(3)} t CO₂e`} />
                  <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick Info */}
          {total === 0 && (
            <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
              <h3 className="font-semibold text-green-800 mb-2">🌱 Empieza a introducir datos</h3>
              <p className="text-sm text-green-700">
                No hay datos de emisiones registrados para {anio}. Ve a las pestañas de
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
