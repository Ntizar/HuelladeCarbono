/**
 * Sidebar de navegación principal del SaaS de Huella de Carbono
 * 
 * Mapea las pestañas del Excel MITECO a las rutas del frontend:
 * Dashboard | Organización | Alcance 1 | Alcance 2 | Resultados | Informes | Admin | Factores
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠', description: 'KPIs y resumen' },
  { href: '/organizacion', label: 'Organización', icon: '📋', description: 'Datos generales' },
  { href: '/alcance1/instalaciones', label: 'Inst. Fijas', icon: '🏭', description: 'Alcance 1', group: 'Alcance 1' },
  { href: '/alcance1/vehiculos', label: 'Vehículos', icon: '🚗', description: 'Alcance 1' },
  { href: '/alcance1/fugitivas', label: 'Fugitivas', icon: '💨', description: 'Alcance 1' },
  { href: '/alcance1/proceso', label: 'Proceso', icon: '⚙️', description: 'Alcance 1' },
  { href: '/alcance1/renovables', label: 'Renovables', icon: '🌱', description: 'Info adicional' },
  { href: '/alcance2', label: 'Electricidad', icon: '⚡', description: 'Alcance 2' },
  { href: '/resultados', label: 'Resultados', icon: '📊', description: 'Informe final' },
  { href: '/informes', label: 'Informes', icon: '📄', description: 'Descargas' },
  { href: '/factores', label: 'Factores', icon: '🔬', description: 'Solo lectura' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: '👥', description: 'Admin', group: 'Admin' },
  { href: '/admin/auditoria', label: 'Auditoría', icon: '📝', description: 'Admin' },
];

export default function Sidebar() {
  const pathname = usePathname();
  
  let lastGroup = '';
  
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          🌿 <span>Huella de Carbono</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">Calculadora MITECO V.31</p>
      </div>
      
      {/* Navegación */}
      <nav className="mt-4 space-y-1 px-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const showGroupLabel = item.group && item.group !== lastGroup;
          if (item.group) lastGroup = item.group;
          
          return (
            <div key={item.href}>
              {showGroupLabel && (
                <div className="px-4 pt-4 pb-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {item.group}
                  </span>
                </div>
              )}
              <Link
                href={item.href}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              >
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            </div>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
            D
          </div>
          <div>
            <p className="text-sm font-medium text-white">Demo Admin</p>
            <p className="text-xs text-gray-400">Plan Pro</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
