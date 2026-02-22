/**
 * Alcance 1 - Vehículos y Maquinaria (Pestaña 4 del Excel MITECO)
 * 
 * Dos métodos de cálculo:
 * - A1: Por combustible consumido (litros/kWh)
 * - A2: Por distancia recorrida (km)
 * 
 * Categorías de vehículo: Turismos (M1), Furgonetas (N1), Camiones (N2/N3), Autobuses (M2/M3), Motocicletas (L)
 */

'use client';

import { useEffect, useState } from 'react';
import SedeSelector from '@/components/shared/SedeSelector';

interface VehiculoEntry {
  id: string;
  edificio_sede: string;
  tipo_combustible: string;
  categoria_vehiculo: string;
  cantidad: number;
  emisiones_totales_kg_co2e: number;
}

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoEntry[]>([]);
  const [dropdowns, setDropdowns] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [metodo, setMetodo] = useState<'A1' | 'A2'>('A1');
  
  // Form
  const [edificio, setEdificio] = useState('');
  const [combustible, setCombustible] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cantidad, setCantidad] = useState('');
  
  useEffect(() => {
    Promise.all([
      fetch('/api/data?tipo=scope1_vehiculos&orgId=org_001&anio=2024').then(r => r.json()),
      fetch('/api/data?tipo=dropdowns').then(r => r.json()),
    ]).then(([data, dd]) => {
      if (data?.transporte_carretera_A1_combustible) {
        setVehiculos([
          ...data.transporte_carretera_A1_combustible,
          ...data.transporte_carretera_A2_distancia_km,
        ]);
      }
      setDropdowns(dd || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  
  const totalKg = vehiculos.reduce((s, v) => s + (v.emisiones_totales_kg_co2e || 0), 0);
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🚗 Vehículos y Maquinaria</h1>
        <p className="text-gray-500 mt-1">Alcance 1 · Transporte por carretera, ferroviario, marítimo y aéreo</p>
      </div>
      
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          {message}
          <button onClick={() => setMessage('')} className="float-right">×</button>
        </div>
      )}
      
      {/* Método selector */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Método de cálculo</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setMetodo('A1')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              metodo === 'A1' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            A1 · Por combustible consumido (litros/kWh)
          </button>
          <button
            onClick={() => setMetodo('A2')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              metodo === 'A2' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            A2 · Por distancia recorrida (km)
          </button>
        </div>
      </div>
      
      {/* Form */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Añadir vehículo (Método {metodo})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <SedeSelector value={edificio} onChange={setEdificio} />
          </div>
          <div>
            <label className="form-label">Combustible</label>
            <select value={combustible} onChange={e => setCombustible(e.target.value)} className="form-select">
              <option value="">Seleccionar...</option>
              {(dropdowns.tipos_combustible_vehiculo || []).map((t: string) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Categoría vehículo</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} className="form-select">
              <option value="">Seleccionar...</option>
              {(dropdowns.categorias_vehiculo || []).map((t: string) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">{metodo === 'A1' ? 'Cantidad (litros/kWh)' : 'Distancia (km)'}</label>
            <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} className="form-input" min="0" step="0.01" />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full">+ Añadir</button>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Registros ({vehiculos.length})</h2>
          <div className="badge-blue">Total: {(totalKg / 1000).toFixed(3)} t CO₂e</div>
        </div>
        
        {loading ? (
          <p className="text-gray-400 py-8 text-center">Cargando...</p>
        ) : vehiculos.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">No hay registros de vehículos.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sede</th>
                <th>Combustible</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>kg CO₂e</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map(v => (
                <tr key={v.id}>
                  <td>{v.edificio_sede}</td>
                  <td>{v.tipo_combustible}</td>
                  <td>{v.categoria_vehiculo}</td>
                  <td className="text-right">{v.cantidad?.toLocaleString('es-ES')}</td>
                  <td className="text-right font-semibold text-green-700">{v.emisiones_totales_kg_co2e?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
