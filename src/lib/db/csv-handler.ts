/**
 * CSV Handler - Gestión de base de datos CSV para el SaaS de Huella de Carbono
 * 
 * Implementa operaciones CRUD sobre archivos CSV que actúan como tablas de base de datos:
 * - users.csv: Usuarios del sistema
 * - organizations.csv: Organizaciones registradas
 * - audit_log.csv: Log de auditoría de todas las acciones
 * - hc_data.csv: Datos de huella de carbono por organización y año
 * 
 * Utiliza papaparse para el parsing y fs para la persistencia.
 * En producción se reemplazaría por una base de datos relacional (PostgreSQL).
 */

import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

const STORE_DIR = path.join(process.cwd(), 'store');

/**
 * Asegura que el directorio store/ existe
 */
function ensureStoreDir(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

/**
 * Obtiene la ruta completa de un archivo CSV
 */
function getFilePath(tableName: string): string {
  return path.join(STORE_DIR, `${tableName}.csv`);
}

/**
 * Lee un archivo CSV completo y devuelve un array de objetos tipados
 * @param tableName - Nombre del archivo CSV (sin extensión)
 * @returns Array de registros como objetos
 */
export async function readCSV<T extends Record<string, any>>(tableName: string): Promise<T[]> {
  ensureStoreDir();
  const filePath = getFilePath(tableName);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  
  if (!csvContent.trim()) {
    return [];
  }
  
  const result = Papa.parse<T>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true, // Convierte números automáticamente
    transformHeader: (header: string) => header.trim(),
  });
  
  if (result.errors.length > 0) {
    console.warn(`Advertencias al leer ${tableName}.csv:`, result.errors);
  }
  
  return result.data;
}

/**
 * Escribe un array completo de registros en un archivo CSV (sobrescribe)
 * @param tableName - Nombre del archivo CSV (sin extensión)
 * @param data - Array de registros a escribir
 */
export async function writeCSV<T extends Record<string, any>>(
  tableName: string,
  data: T[]
): Promise<void> {
  ensureStoreDir();
  const filePath = getFilePath(tableName);
  
  if (data.length === 0) {
    fs.writeFileSync(filePath, '', 'utf-8');
    return;
  }
  
  const csv = Papa.unparse(data, {
    header: true,
    newline: '\n',
  });
  
  fs.writeFileSync(filePath, csv, 'utf-8');
}

/**
 * Añade un único registro al final del archivo CSV
 * @param tableName - Nombre del archivo CSV
 * @param row - Registro a añadir
 */
export async function appendRow<T extends Record<string, any>>(
  tableName: string,
  row: T
): Promise<void> {
  ensureStoreDir();
  const _filePath = getFilePath(tableName);
  
  const existingData = await readCSV<T>(tableName);
  existingData.push(row);
  await writeCSV(tableName, existingData);
}

/**
 * Actualiza un registro existente por su ID
 * @param tableName - Nombre del archivo CSV
 * @param id - ID del registro a actualizar
 * @param updates - Campos a actualizar (parcial)
 * @returns El registro actualizado o null si no se encontró
 */
export async function updateRow<T extends Record<string, any>>(
  tableName: string,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  const data = await readCSV<T>(tableName);
  const index = data.findIndex((row) => row.id === id);
  
  if (index === -1) {
    return null;
  }
  
  data[index] = { ...data[index], ...updates };
  await writeCSV(tableName, data);
  return data[index];
}

/**
 * Elimina un registro por su ID
 * @param tableName - Nombre del archivo CSV
 * @param id - ID del registro a eliminar
 * @returns true si se eliminó, false si no se encontró
 */
export async function deleteRow(tableName: string, id: string): Promise<boolean> {
  const data = await readCSV(tableName);
  const initialLength = data.length;
  const filteredData = data.filter((row) => row.id !== id);
  
  if (filteredData.length === initialLength) {
    return false;
  }
  
  await writeCSV(tableName, filteredData);
  return true;
}

/**
 * Busca un registro por su ID
 * @param tableName - Nombre del archivo CSV
 * @param id - ID a buscar
 * @returns El registro encontrado o null
 */
export async function findById<T extends Record<string, any>>(
  tableName: string,
  id: string
): Promise<T | null> {
  const data = await readCSV<T>(tableName);
  return data.find((row) => row.id === id) || null;
}

/**
 * Filtra registros por organización (multi-tenancy)
 * Fundamental para asegurar que cada organización solo accede a sus datos.
 * @param tableName - Nombre del archivo CSV
 * @param orgId - ID de la organización
 * @returns Array de registros de esa organización
 */
export async function filterByOrg<T extends Record<string, any>>(
  tableName: string,
  orgId: string
): Promise<T[]> {
  const data = await readCSV<T>(tableName);
  return data.filter((row) => row.org_id === orgId || row.organizacion_id === orgId);
}

/**
 * Filtra registros por un campo y valor arbitrarios
 * @param tableName - Nombre del archivo CSV
 * @param field - Campo por el que filtrar
 * @param value - Valor a buscar
 * @returns Array de registros que coinciden
 */
export async function filterBy<T extends Record<string, any>>(
  tableName: string,
  field: keyof T,
  value: any
): Promise<T[]> {
  const data = await readCSV<T>(tableName);
  return data.filter((row) => row[field] === value);
}

/**
 * Cuenta registros por organización
 */
export async function countByOrg(tableName: string, orgId: string): Promise<number> {
  const data = await filterByOrg(tableName, orgId);
  return data.length;
}

/**
 * Busca registros con paginación
 */
export async function paginatedRead<T extends Record<string, any>>(
  tableName: string,
  page: number = 1,
  pageSize: number = 20,
  filters?: Partial<T>
): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
  let data = await readCSV<T>(tableName);
  
  // Aplicar filtros
  if (filters) {
    data = data.filter((row) =>
      Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        return String(row[key]).toLowerCase().includes(String(value).toLowerCase());
      })
    );
  }
  
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paginatedData = data.slice(start, start + pageSize);
  
  return {
    data: paginatedData,
    total,
    page,
    totalPages,
  };
}
