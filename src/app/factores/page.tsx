/**
 * Factores de Emisión (Pestaña 10 del Excel MITECO)
 * 
 * Tabla de consulta read-only con todos los factores de emisión cargados
 * desde el JSON generado por el parser del Excel MITECO V.31.
 */

'use client';

import { useEffect, useState } from 'react';

interface FactorCombustible {
  combustible: string;
  unidad: string;
  fe_co2_kg: number;
  fe_ch4_kg: number;
  fe_n2o_kg: number;
}

interface FactorVehiculo {
  combustible: string;
  unidad: string;
  fe_co2_kg: number;
  fe_ch4_kg: number;
  fe_n2o_kg: number;
}

interface FactorGas {
  gas: string;
  pca: number;
}

interface FactorElectricidad {
  comercializadora: string;
  factor_co2_kg_kwh: number;
}

export default function FactoresPage() {
  const [factors, setFactors] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'fijos' | 'vehiculos' | 'gases' | 'electricidad'>('fijos');
  
  useEffect(() => {
    fetch('/api/data?tipo=emission_factors')
      .then(r => r.json())
      .then(d => {
        setFactors(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  const tabs = [
    { key: 'fijos', label: '🔥 Combustibles fijos', count: factors?.combustibles_fijos?.length || 0 },
    { key: 'vehiculos', label: '🚗 Combustibles vehículos', count: factors?.combustibles_vehiculos?.length || 0 },
    { key: 'gases', label: '❄️ Gases refrigerantes', count: factors?.gases_refrigerantes?.length || 0 },
    { key: 'electricidad', label: '⚡ Electricidad', count: factors?.electricidad?.length || 0 },
  ] as const;
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📋 Factores de Emisión</h1>
        <p className="text-gray-500 mt-1">Factores de emisión MITECO V.31 · Solo lectura</p>
      </div>
      
      <div className="card mb-6 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          Estos factores de emisión provienen de la calculadora oficial del MITECO (Versión 31, 2007-2024). 
          Los PCA de gases refrigerantes corresponden al AR6 del IPCC (CH₄=27.9, N₂O=273).
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="card">
          <p className="text-gray-400 py-16 text-center">Cargando factores de emisión...</p>
        </div>
      ) : !factors ? (
        <div className="card">
          <p className="text-red-500 py-8 text-center">No se pudieron cargar los factores. Verifique data/emission_factors.json</p>
        </div>
      ) : (
        <div className="card">
          {/* Combustibles fijos */}
          {tab === 'fijos' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Combustibles para instalaciones fijas</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Combustible</th>
                    <th>Unidad</th>
                    <th>FE CO₂ (kg)</th>
                    <th>FE CH₄ (kg)</th>
                    <th>FE N₂O (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {(factors.combustibles_fijos || []).map((f: FactorCombustible, i: number) => (
                    <tr key={i}>
                      <td className="font-medium">{f.combustible}</td>
                      <td className="text-gray-500">{f.unidad}</td>
                      <td className="text-right">{f.fe_co2_kg?.toFixed(4)}</td>
                      <td className="text-right">{f.fe_ch4_kg?.toFixed(6)}</td>
                      <td className="text-right">{f.fe_n2o_kg?.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          
          {/* Combustibles vehículos */}
          {tab === 'vehiculos' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Combustibles para vehículos y maquinaria</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Combustible</th>
                    <th>Unidad</th>
                    <th>FE CO₂ (kg)</th>
                    <th>FE CH₄ (kg)</th>
                    <th>FE N₂O (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {(factors.combustibles_vehiculos || []).map((f: FactorVehiculo, i: number) => (
                    <tr key={i}>
                      <td className="font-medium">{f.combustible}</td>
                      <td className="text-gray-500">{f.unidad}</td>
                      <td className="text-right">{f.fe_co2_kg?.toFixed(4)}</td>
                      <td className="text-right">{f.fe_ch4_kg?.toFixed(6)}</td>
                      <td className="text-right">{f.fe_n2o_kg?.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          
          {/* Gases refrigerantes */}
          {tab === 'gases' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Gases refrigerantes y su PCA (AR6 IPCC)</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Gas</th>
                    <th>PCA (Potencial de Calentamiento Atmosférico)</th>
                  </tr>
                </thead>
                <tbody>
                  {(factors.gases_refrigerantes || []).map((g: FactorGas, i: number) => (
                    <tr key={i}>
                      <td className="font-medium">{g.gas}</td>
                      <td className="text-right font-semibold">{g.pca?.toLocaleString('es-ES')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          
          {/* Electricidad */}
          {tab === 'electricidad' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Factores de emisión de comercializadoras eléctricas (CNMC)</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Comercializadora</th>
                    <th>Factor CO₂ (kg/kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {(factors.electricidad || []).map((e: FactorElectricidad, i: number) => (
                    <tr key={i}>
                      <td className="font-medium">{e.comercializadora}</td>
                      <td className="text-right font-semibold">{e.factor_co2_kg_kwh?.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
