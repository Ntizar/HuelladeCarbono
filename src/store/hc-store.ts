/**
 * Zustand Store - Estado global de la aplicación
 * 
 * Gestiona el estado del frontend para la calculadora de huella de carbono:
 * - Organización activa y año de cálculo
 * - Datos de emisiones por alcance
 * - Resultados calculados
 * - Alertas del sistema
 */

import { create } from 'zustand';
import type { Organizacion, Resultados } from '@/types/hc-schemas';

interface HCState {
  // Organización
  orgId: string | null;
  anioCalculo: number;
  organization: Organizacion | null;
  
  // Resultados
  results: Resultados | null;
  
  // UI
  loading: boolean;
  alerts: string[];
  sidebarOpen: boolean;
  
  // Acciones
  setOrgId: (orgId: string) => void;
  setAnioCalculo: (anio: number) => void;
  setOrganization: (org: Organizacion) => void;
  setResults: (results: Resultados) => void;
  setLoading: (loading: boolean) => void;
  addAlert: (alert: string) => void;
  clearAlerts: () => void;
  dismissAlert: (index: number) => void;
  toggleSidebar: () => void;
}

export const useHCStore = create<HCState>((set) => ({
  orgId: 'org_001',
  anioCalculo: 2024,
  organization: null,
  results: null,
  loading: false,
  alerts: [],
  sidebarOpen: true,
  
  setOrgId: (orgId) => set({ orgId }),
  setAnioCalculo: (anio) => set({ anioCalculo: anio }),
  setOrganization: (organization) => set({ organization }),
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ loading }),
  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  clearAlerts: () => set({ alerts: [] }),
  dismissAlert: (index) =>
    set((state) => ({
      alerts: state.alerts.filter((_, i) => i !== index),
    })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
