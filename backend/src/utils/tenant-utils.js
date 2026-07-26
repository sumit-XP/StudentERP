import pool from "../config/db.js";

export function generateSchoolCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export async function generateUniqueSchoolCode() {
  for (let attempt = 0; attempt < 25; attempt++) {
    const code = generateSchoolCode();
    const existing = await pool.query("SELECT id FROM schools WHERE school_code = $1", [code]);
    if (existing.rows.length === 0) return code;
  }
  throw new Error("Unable to generate a unique school code");
}

export async function getSchoolByCodeOrId(value) {
  if (!value) return null;
  const result = await pool.query(
    "SELECT * FROM schools WHERE school_code = $1 OR id::text = $1",
    [String(value)]
  );
  return result.rows[0] || null;
}

export async function resolveTenantId(req) {
  if (req.user?.role === "super_admin") {
    const requested = req.body?.school_id || req.body?.schoolCode || req.body?.school_code || req.query?.school_id || req.query?.schoolCode || req.query?.school_code;
    if (!requested) return null;
    const school = await getSchoolByCodeOrId(requested);
    if (!school) throw new Error("School not found");
    return school.id;
  }

  if (!req.user?.school_id) {
    throw new Error("School context required");
  }

  return req.user.school_id;
}
