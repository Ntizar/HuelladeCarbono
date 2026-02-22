/**
 * Informes - Descarga de informes en Excel, CSV y PDF
 * 
 * Permite generar y descargar el informe anual de huella de carbono 
 * en distintos formatos, incluyendo el formato MITECO para inscripción.
 */

'use client';

import { useState } from 'react';

type Formato = 'excel' | 'csv' | 'json' | 'pdf';

interface ReportOption {
  formato: Formato;
  label: string;
  icon: string;
  description: string;
  extension: string;
  color: string;
}

const REPORTS: ReportOption[] = [
  {
    formato: 'excel',
    label: 'Excel (MITECO)',
    icon: '📗',
    description: 'Formato compatible con la calculadora MITECO V.31. Incluye todas las pestañas con datos y cálculos.',
    extension: '.xlsx',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
  },
  {
    formato: 'csv',
    label: 'CSV',
    icon: '📄',
    description: 'Datos tabulares separados por comas. Ideal para importar en otras herramientas de análisis.',
    extension: '.csv',
    color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
  },
  {
    formato: 'json',
    label: 'JSON',
    icon: '🔧',
    description: 'Datos en formato JSON estructurado. Para integración con sistemas externos o APIs.',
    extension: '.json',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  },
  {
    formato: 'pdf',
    label: 'PDF Resumen',
    icon: '📕',
    description: 'Informe resumen en PDF con gráficos y tabla de emisiones. Para presentación y registro.',
    extension: '.pdf',
    color: 'bg-red-50 border-red-200 hover:bg-red-100',
  },
];

export default function InformesPage() {
  const [downloading, setDownloading] = useState<Formato | null>(null);
  const [message, setMessage] = useState('');
  const [anio] = useState(2024);
  
  const handleDownload = async (formato: Formato) => {
    setDownloading(formato);
    setMessage('');
    try {
      const res = await fetch(`/api/reports?formato=${formato}&orgId=org_001&anio=${anio}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
        setMessage(`❌ ${err.error || 'Error al generar informe'}`);
        setDownloading(null);
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const ext = REPORTS.find(r => r.formato === formato)?.extension || '';
      a.download = `huella_carbono_${anio}${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setMessage(`✅ Informe ${formato.toUpperCase()} descargado correctamente`);
    } catch {
      setMessage('❌ Error de conexión al generar el informe');
    }
    setDownloading(null);
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📥 Informes</h1>
        <p className="text-gray-500 mt-1">Genera y descarga el informe anual de huella de carbono</p>
      </div>
      
      {message && (
        <div className="mb-6 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">×</button>
        </div>
      )}
      
      {/* Year selector */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <label className="form-label mb-0">Año del informe:</label>
          <span className="text-2xl font-bold text-green-700">{anio}</span>
          <span className="text-sm text-gray-400">| org_001 - Empresa Demo S.A.</span>
        </div>
      </div>
      
      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {REPORTS.map(r => (
          <button
            key={r.formato}
            onClick={() => handleDownload(r.formato)}
            disabled={downloading !== null}
            className={`card ${r.color} border-2 text-left transition-all cursor-pointer disabled:opacity-50`}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{r.icon}</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{r.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  {downloading === r.formato ? (
                    <span className="text-sm text-gray-500">⏳ Generando...</span>
                  ) : (
                    <span className="text-sm font-medium text-green-700">↓ Descargar {r.extension}</span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Info */}
      <div className="card bg-amber-50 border-amber-200">
        <h3 className="font-semibold text-amber-800 mb-2">ℹ️ Sobre los informes</h3>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• El <strong>Excel MITECO</strong> genera un archivo compatible con el formato oficial de la calculadora V.31 del Ministerio.</li>
          <li>• El <strong>CSV</strong> exporta los datos en formato tabular para análisis en herramientas como Excel o Power BI.</li>
          <li>• El <strong>JSON</strong> contiene todos los datos estructurados para integración con otros sistemas.</li>
          <li>• El <strong>PDF</strong> genera un resumen ejecutivo con los datos principales y ratios.</li>
          <li>• Asegúrese de haber completado todos los datos y ejecutado el recálculo antes de descargar.</li>
        </ul>
      </div>
    </div>
  );
}
