/**
 * Script de migración: JSON local → PostgreSQL (Neon)
 * 
 * Lee todos los datos existentes de data/orgs/ y store/ y los inserta
 * en la base de datos Neon. También ejecuta el schema.sql.
 * 
 * Uso:
 *   1. Configura DATABASE_URL en .env.local con tu connection string de Neon
 *   2. Ejecuta: node scripts/migrate-to-neon.mjs
 * 
 * Este script es IDEMPOTENTE — puede ejecutarse varias veces sin duplicar datos.
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Cargar .env.local
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada en .env.local');
  console.error('   Obtén tu connection string de: https://console.neon.tech/app/projects/orange-mountain-06310787');
  console.error('   Formato: postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runSchema() {
  console.log('📦 Ejecutando schema.sql...');
  const schemaPath = path.join(ROOT, 'src', 'lib', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  
  // Dividir por sentencias (separadas por ;)
  const statements = schemaSql
    .split(/;[\s]*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const stmt of statements) {
    try {
      await sql(stmt);
    } catch (err) {
      // Ignorar errores de "already exists" (idempotente)
      if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
        console.warn(`  ⚠ ${err.message?.substring(0, 100)}`);
      }
    }
  }
  console.log('  ✓ Schema creado');
}

async function migrateOrgData() {
  const orgsDir = path.join(ROOT, 'data', 'orgs');
  if (!fs.existsSync(orgsDir)) {
    console.log('  ℹ No hay datos de organizaciones para migrar');
    return;
  }

  const orgIds = fs.readdirSync(orgsDir).filter(f => 
    fs.statSync(path.join(orgsDir, f)).isDirectory()
  );

  let totalRows = 0;

  for (const orgId of orgIds) {
    const orgDir = path.join(orgsDir, orgId);
    const years = fs.readdirSync(orgDir).filter(f => /^\d{4}$/.test(f));

    for (const year of years) {
      const yearDir = path.join(orgDir, year);
      const anio = parseInt(year);

      // Mapeo de archivos a tipo
      const fileMap = {
        'organization.json': 'organization',
        'scope1_instalaciones_fijas.json': 'scope1_instalaciones_fijas',
        'scope1_vehiculos.json': 'scope1_vehiculos',
        'scope1_fugitivas.json': 'scope1_fugitivas',
        'scope1_proceso.json': 'scope1_proceso',
        'scope2_electricidad.json': 'scope2_electricidad',
        'results.json': 'results',
      };

      for (const [file, tipo] of Object.entries(fileMap)) {
        const filePath = path.join(yearDir, file);
        if (fs.existsSync(filePath)) {
          try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            await sql(
              `INSERT INTO org_year_data (org_id, anio, tipo, data)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (org_id, anio, tipo)
               DO UPDATE SET data = $4, updated_at = NOW()`,
              [orgId, anio, tipo, JSON.stringify(data)]
            );
            totalRows++;
          } catch (err) {
            console.warn(`  ⚠ Error migrando ${orgId}/${year}/${file}: ${err.message}`);
          }
        }
      }

      // Migrar sedes
      const sedesPath = path.join(yearDir, 'sedes.json');
      if (fs.existsSync(sedesPath)) {
        try {
          const sedesData = JSON.parse(fs.readFileSync(sedesPath, 'utf-8'));
          if (sedesData.sedes) {
            for (const sede of sedesData.sedes) {
              await sql(
                `INSERT INTO sedes (id, org_id, anio, nombre, direccion)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (id) DO NOTHING`,
                [sede.id, orgId, anio, sede.nombre, sede.direccion || null]
              );
            }
          }
        } catch (err) {
          console.warn(`  ⚠ Error migrando sedes ${orgId}/${year}: ${err.message}`);
        }
      }
    }
  }

  console.log(`  ✓ ${totalRows} registros org_year_data migrados`);
}

async function migrateUsers() {
  const Papa = (await import('papaparse')).default;
  const usersPath = path.join(ROOT, 'store', 'users.csv');
  if (!fs.existsSync(usersPath)) {
    console.log('  ℹ No hay users.csv para migrar');
    return;
  }

  const content = fs.readFileSync(usersPath, 'utf-8');
  if (!content.trim()) return;

  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  let count = 0;

  for (const row of parsed.data) {
    try {
      await sql(
        `INSERT INTO users (id, email, nombre, password_hash, role, org_id, plan, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id, row.email, row.nombre || '', row.password_hash,
          row.rol || 'viewer', row.organizacion_id || null,
          row.plan || 'free', row.activo !== 'false',
        ]
      );
      count++;
    } catch (err) {
      console.warn(`  ⚠ Error migrando usuario ${row.email}: ${err.message}`);
    }
  }

  console.log(`  ✓ ${count} usuarios migrados`);
}

async function migrateAuditLog() {
  const Papa = (await import('papaparse')).default;
  const auditPath = path.join(ROOT, 'store', 'audit_log.csv');
  if (!fs.existsSync(auditPath)) {
    console.log('  ℹ No hay audit_log.csv para migrar');
    return;
  }

  const content = fs.readFileSync(auditPath, 'utf-8');
  if (!content.trim()) return;

  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  let count = 0;

  for (const row of parsed.data) {
    try {
      await sql(
        `INSERT INTO audit_log (id, user_id, org_id, accion, entidad_tipo, entidad_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id, row.user_id, row.org_id, row.accion,
          row.entidad_tipo, row.entidad_id, row.timestamp || new Date().toISOString(),
        ]
      );
      count++;
    } catch (err) {
      // Silent — audit log rows may have inconsistent formats
    }
  }

  console.log(`  ✓ ${count} registros de auditoría migrados`);
}

async function showStats() {
  const sizeRow = await sql('SELECT pg_database_size(current_database()) as size');
  const countRow = await sql('SELECT COUNT(*) as count FROM org_year_data');
  const sizeMB = (parseInt(sizeRow[0].size) / 1024 / 1024).toFixed(2);
  const rows = countRow[0].count;
  
  console.log('');
  console.log(`📊 Estado de la BBDD:`);
  console.log(`   Tamaño: ${sizeMB} MB / 400 MB (límite soft) / 512 MB (Neon free tier)`);
  console.log(`   Filas en org_year_data: ${rows}`);
  console.log(`   Uso: ${((parseInt(sizeRow[0].size) / (400 * 1024 * 1024)) * 100).toFixed(1)}%`);
}

// ─── Main ───
async function main() {
  console.log('');
  console.log('🚀 Migración a Neon PostgreSQL');
  console.log('   Proyecto: orange-mountain-06310787');
  console.log('');

  // 1. Test connection
  console.log('🔌 Conectando a Neon...');
  try {
    const versionRow = await sql('SELECT version()');
    console.log(`  ✓ Conectado: ${versionRow[0].version.substring(0, 50)}...`);
  } catch (err) {
    console.error(`  ❌ Error de conexión: ${err.message}`);
    process.exit(1);
  }

  // 2. Schema
  await runSchema();

  // 3. Migrate data
  console.log('');
  console.log('📂 Migrando datos...');
  await migrateOrgData();
  await migrateUsers();
  await migrateAuditLog();

  // 4. Stats
  await showStats();

  console.log('');
  console.log('✅ Migración completada. La app ahora usa PostgreSQL (Neon).');
  console.log('');
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
