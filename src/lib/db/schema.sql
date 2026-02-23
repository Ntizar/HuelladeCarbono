-- ═══════════════════════════════════════════════════════════════════
-- Schema PostgreSQL — Calculadora Huella de Carbono (Neon)
-- Proyecto: https://console.neon.tech/app/projects/orange-mountain-06310787
-- Desarrollado por David Antizar · 2026
-- ═══════════════════════════════════════════════════════════════════
--
-- DISEÑO:
-- · org_year_data: tabla principal con JSONB. Replica la estructura
--   data/orgs/{org_id}/{anio}/{tipo}.json en una sola tabla.
--   Clave compuesta (org_id, anio, tipo) → cada fila = un JSON file.
--
-- · users: usuarios del sistema (reemplaza store/users.csv)
-- · audit_log: log de auditoría (reemplaza store/audit_log.csv)
-- · sedes: centros de trabajo por org/año
--
-- · Los factores de emisión y dropdowns se mantienen como archivos
--   locales (son estáticos, solo lectura, no gastan espacio en BBDD).
--
-- FREE TIER NEON:
-- · 512 MB de almacenamiento
-- · Se implementa un HARD BLOCK a 400 MB en la capa de aplicación
-- ═══════════════════════════════════════════════════════════════════

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tabla principal: datos HC por organización/año ─────────────

CREATE TABLE IF NOT EXISTS org_year_data (
  org_id    TEXT    NOT NULL,
  anio      INTEGER NOT NULL,
  tipo      TEXT    NOT NULL,
  -- tipo: 'organization' | 'scope1_instalaciones_fijas' | 'scope1_vehiculos'
  --       | 'scope1_fugitivas' | 'scope1_proceso' | 'scope2_electricidad' | 'results'
  data      JSONB   NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, anio, tipo)
);

-- Índice para consultas frecuentes por org_id
CREATE INDEX IF NOT EXISTS idx_oyd_org ON org_year_data (org_id);

-- ─── Sedes / Centros de trabajo ─────────────────────────────────

CREATE TABLE IF NOT EXISTS sedes (
  id        TEXT    PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  org_id    TEXT    NOT NULL,
  anio      INTEGER NOT NULL,
  nombre    TEXT    NOT NULL,
  direccion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sedes_org_anio ON sedes (org_id, anio);

-- ─── Usuarios ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  email         TEXT UNIQUE NOT NULL,
  nombre        TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'viewer',  -- admin | editor | viewer | auditor
  org_id        TEXT,
  plan          TEXT NOT NULL DEFAULT 'free',    -- free | pro | enterprise
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

-- ─── Log de auditoría ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id           TEXT,
  org_id            TEXT,
  accion            TEXT NOT NULL,  -- CREATE | UPDATE | DELETE | CALCULATE | EXPORT | LOGIN | LOGOUT
  entidad_tipo      TEXT,
  entidad_id        TEXT,
  campo_modificado  TEXT,
  valor_anterior    TEXT,
  valor_nuevo       TEXT,
  ip_address        TEXT,
  session_id        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log (org_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log (created_at DESC);

-- ─── Tabla de control de uso (para el free tier guard) ──────────

CREATE TABLE IF NOT EXISTS usage_control (
  id          SERIAL PRIMARY KEY,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  db_size_bytes BIGINT NOT NULL,
  row_count   INTEGER NOT NULL,
  blocked     BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─── Usuario demo inicial ───────────────────────────────────────
-- Password: demo123 (bcrypt hash)
INSERT INTO users (id, email, nombre, password_hash, role, org_id, plan)
VALUES (
  'usr_001',
  'admin@demo.com',
  'Admin Demo',
  '$2a$10$QSqPqMkX8Z8Z8Z8Z8Z8Z8OmN2/TqGBHH8c5pYMkIbYyQNKHdCCa2',
  'admin',
  'org_001',
  'free'
) ON CONFLICT (id) DO NOTHING;
