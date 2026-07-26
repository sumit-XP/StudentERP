import crypto from "crypto";
import bcrypt from "bcrypt";
import pool from "../config/db.js";

const SUPER_ADMIN_EMAIL = "sumit2008@gmail.com";
const SUPER_ADMIN_PASSWORD = "sumit2008@gmail.com";

export async function ensureSuperAdmin() {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE TABLE IF NOT EXISTS schools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_code CHAR(5) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(100) UNIQUE,
        address TEXT,
        place VARCHAR(255),
        owner_name VARCHAR(255),
        tenure VARCHAR(100),
        renewal_date DATE,
        services_taken JSONB DEFAULT '[]',
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        logo_url TEXT,
        plan VARCHAR(50) DEFAULT 'basic',
        is_active BOOLEAN DEFAULT true,
        max_students INTEGER DEFAULT 500,
        max_teachers INTEGER DEFAULT 50,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
    `);

    await pool.query(`
      INSERT INTO roles (name, description)
      VALUES ('super_admin', 'Platform Super Administrator')
      ON CONFLICT (name) DO NOTHING
    `);

    const roleResult = await pool.query("SELECT id FROM roles WHERE name = 'super_admin'");
    const roleId = roleResult.rows[0]?.id;
    if (!roleId) throw new Error("super_admin role could not be created");

    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    // Check if super admin exists by email to reuse uid or generate new
    const existing = await pool.query("SELECT uid FROM users WHERE email = $1", [SUPER_ADMIN_EMAIL]);
    const uid = existing.rows.length > 0 ? existing.rows[0].uid : crypto.randomUUID();

    await pool.query(
      `INSERT INTO users (uid, password_hash, email, name, role_id, school_id, is_active)
       VALUES ($1, $2, $3, $4, $5, NULL, true)
       ON CONFLICT (email)
       DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, role_id = EXCLUDED.role_id, school_id = NULL, is_active = true, updated_at = CURRENT_TIMESTAMP`,
      [uid, passwordHash, SUPER_ADMIN_EMAIL, "Sumit Super Admin", roleId]
    );

    console.log("✅ Super admin ready:", SUPER_ADMIN_EMAIL);
  } catch (error) {
    console.error("❌ Super admin bootstrap failed:", error.message);
  }
}
