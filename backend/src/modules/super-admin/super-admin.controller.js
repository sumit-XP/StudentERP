import pool from "../../config/db.js";
import dotenv from "dotenv";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { generateUniqueSchoolCode, getSchoolByCodeOrId } from "../../utils/tenant-utils.js";
dotenv.config();

// ─────────────────────────────────────────────────────────────────
// School CRUD (Super-Admin only)
// ─────────────────────────────────────────────────────────────────

/** Create a new tenant school */
export const createSchool = async (req, res) => {
  try {
    const {
      name, address, place, owner_name, tenure, renewal_date, services_taken,
      contact_email, contact_phone, subdomain, plan, max_students, max_teachers, logo_url
    } = req.body;

    if (!name || !contact_email) {
      return res.status(400).json({ error: "School name and contact email are required" });
    }

    if (subdomain) {
      const existing = await pool.query("SELECT id FROM schools WHERE subdomain = $1", [subdomain]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Subdomain already taken" });
      }
    }

    const schoolCode = await generateUniqueSchoolCode();
    const services = Array.isArray(services_taken)
      ? services_taken
      : String(services_taken || "").split(",").map((item) => item.trim()).filter(Boolean);

    const result = await pool.query(
      `INSERT INTO schools (
        school_code, name, address, place, owner_name, tenure, renewal_date, services_taken,
        contact_email, contact_phone, subdomain, plan, max_students, max_teachers, logo_url
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        schoolCode, name, address || null, place || null, owner_name || null, tenure || null,
        renewal_date || null, JSON.stringify(services), contact_email, contact_phone || null,
        subdomain || null, plan || "basic", max_students || 500, max_teachers || 50, logo_url || null
      ]
    );

    res.status(201).json({ message: "School created successfully", school: result.rows[0] });
  } catch (error) {
    console.error("createSchool error:", error);
    res.status(500).json({ error: error.message });
  }
};

/** List all tenant schools */
export const listSchools = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, plan, is_active } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    let paramIndex = 1;
    let whereClause = "WHERE 1=1";

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR contact_email ILIKE $${paramIndex} OR subdomain ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (plan) {
      whereClause += ` AND plan = $${paramIndex}`;
      params.push(plan);
      paramIndex++;
    }
    if (is_active !== undefined) {
      whereClause += ` AND is_active = $${paramIndex}`;
      params.push(is_active === "true");
      paramIndex++;
    }

    const schoolsResult = await pool.query(
      `SELECT s.*,
        (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id) as user_count
       FROM schools s
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM schools ${whereClause}`,
      params
    );

    res.json({
      schools: schoolsResult.rows,
      totalCount: parseInt(countResult.rows[0].count),
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error("listSchools error:", error);
    res.status(500).json({ error: error.message });
  }
};

/** Get a single school with stats */
export const getSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await getSchoolByCodeOrId(id);
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    res.json({ school });
  } catch (error) {
    console.error("getSchool error:", error);
    res.status(500).json({ error: error.message });
  }
};

/** Update school */
export const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, place, owner_name, tenure, renewal_date, services_taken, contact_email, contact_phone, subdomain, plan, is_active, max_students, max_teachers, logo_url } = req.body;

    const school = await getSchoolByCodeOrId(id);
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    if (subdomain) {
      const existing = await pool.query("SELECT id FROM schools WHERE subdomain = $1 AND id != $2", [subdomain, school.id]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Subdomain already taken" });
      }
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    const services = services_taken === undefined ? undefined : (
      Array.isArray(services_taken)
        ? services_taken
        : String(services_taken || "").split(",").map((item) => item.trim()).filter(Boolean)
    );
    const fields = { name, address, place, owner_name, tenure, renewal_date, services_taken: services === undefined ? undefined : JSON.stringify(services), contact_email, contact_phone, subdomain, plan, is_active, max_students, max_teachers, logo_url };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}${key === "services_taken" ? "::jsonb" : ""}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(school.id);

    const result = await pool.query(
      `UPDATE schools SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({ message: "School updated", school: result.rows[0] });
  } catch (error) {
    console.error("updateSchool error:", error);
    res.status(500).json({ error: error.message });
  }
};

/** Toggle school active status */
export const toggleSchoolStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active (boolean) is required" });
    }

    const result = await pool.query(
      `UPDATE schools SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, is_active`,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "School not found" });
    }

    res.json({
      message: `School ${is_active ? "activated" : "suspended"} successfully`,
      school: result.rows[0],
    });
  } catch (error) {
    console.error("toggleSchoolStatus error:", error);
    res.status(500).json({ error: error.message });
  }
};

/** Create the first or additional admin for a school */
export const createSchoolAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }

    const school = await getSchoolByCodeOrId(id);
    if (!school) return res.status(404).json({ error: "School not found" });
    if (!school.is_active) return res.status(403).json({ error: "School account is suspended" });

    const existingDb = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingDb.rows.length > 0) return res.status(409).json({ error: "User already exists" });

    const roleResult = await pool.query("SELECT id FROM roles WHERE name = 'admin'");
    const roleId = roleResult.rows[0]?.id;
    if (!roleId) return res.status(500).json({ error: "Admin role missing" });

    const uid = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (uid, password_hash, email, name, role_id, school_id, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, email, name, school_id, is_active, created_at`,
      [uid, passwordHash, email, name, roleId, school.id, phone || null]
    );

    res.status(201).json({
      message: "School admin created",
      admin: { ...result.rows[0], role: "admin", school_code: school.school_code, school_name: school.name },
    });
  } catch (error) {
    console.error("createSchoolAdmin error:", error);
    res.status(500).json({ error: error.message });
  }
};

/** Delete a school */
export const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolResult = await pool.query("SELECT id, name FROM schools WHERE id = $1", [id]);
    if (schoolResult.rows.length === 0) {
      return res.status(404).json({ error: "School not found" });
    }

    await pool.query("DELETE FROM schools WHERE id = $1", [id]);
    res.json({
      message: `School "${schoolResult.rows[0].name}" deleted`,
      schoolId: id,
    });
  } catch (error) {
    console.error("deleteSchool error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// Platform Stats
// ─────────────────────────────────────────────────────────────────

export const getPlatformStats = async (req, res) => {
  try {
    const [schoolStats, userStats, feeStats] = await Promise.all([
      pool.query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active) as active,
        COUNT(*) FILTER (WHERE NOT is_active) as suspended,
        COUNT(*) FILTER (WHERE plan = 'free') as free_plan,
        COUNT(*) FILTER (WHERE plan = 'pro') as pro_plan
       FROM schools`),
      pool.query(`SELECT COUNT(*) as total_users FROM users`),
      pool.query(`SELECT COALESCE(SUM(amount_paid),0) as total_collected FROM fee_payments`),
    ]);

    res.json({
      schools: schoolStats.rows[0],
      users: userStats.rows[0],
      fees: feeStats.rows[0],
    });
  } catch (error) {
    console.error("getPlatformStats error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// School self-registration (public)
// ─────────────────────────────────────────────────────────────────

export const registerSchool = async (req, res) => {
  try {
    const {
      school_name, school_address, contact_email, contact_phone, subdomain,
      admin_name, admin_email, admin_password,
    } = req.body;

    if (!school_name || !contact_email || !admin_name || !admin_email || !admin_password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (subdomain) {
      const existing = await pool.query("SELECT id FROM schools WHERE subdomain = $1", [subdomain]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Subdomain already taken" });
      }
    }

    const existingEmail = await pool.query("SELECT id FROM users WHERE email = $1", [admin_email]);
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: "Admin email already registered" });
    }

    // Create school
    const schoolCode = await generateUniqueSchoolCode();
    const schoolResult = await pool.query(
      `INSERT INTO schools (school_code, name, address, contact_email, contact_phone, subdomain)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [schoolCode, school_name, school_address || null, contact_email, contact_phone || null, subdomain || null]
    );
    const school = schoolResult.rows[0];

    // Get admin role id
    const roleResult = await pool.query("SELECT id FROM roles WHERE name = 'admin'");
    const roleId = roleResult.rows[0]?.id;

    // Create user in DB
    const uid = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(admin_password, 10);

    await pool.query(
      `INSERT INTO users (uid, password_hash, email, name, role_id, school_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      [uid, passwordHash, admin_email, admin_name, roleId, school.id]
    );

    res.status(201).json({
      message: "School registered successfully! Please log in.",
      school: { id: school.id, school_code: school.school_code, name: school.name, subdomain: school.subdomain },
    });
  } catch (error) {
    console.error("registerSchool error:", error);
    res.status(500).json({ error: error.message });
  }
};

/** Public: Get school info by subdomain */
export const getSchoolBySubdomain = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const result = await pool.query(
      "SELECT id, name, subdomain, logo_url, contact_email, is_active FROM schools WHERE subdomain = $1",
      [subdomain]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "School not found" });
    }

    const school = result.rows[0];
    if (!school.is_active) {
      return res.status(403).json({ error: "School account is suspended" });
    }

    res.json({ school });
  } catch (error) {
    console.error("getSchoolBySubdomain error:", error);
    res.status(500).json({ error: error.message });
  }
};

/** List all users across all schools (super-admin global view) */
export const listAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, school_id, search } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    let paramIndex = 1;
    let whereClause = "WHERE 1=1";

    if (school_id) {
      whereClause += ` AND u.school_id = $${paramIndex}`;
      params.push(school_id);
      paramIndex++;
    }
    if (search) {
      whereClause += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.school_id, u.is_active, u.created_at, r.name as role_name,
              s.name as school_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN schools s ON u.school_id = s.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params
    );

    res.json({
      users: result.rows,
      totalCount: parseInt(countResult.rows[0].count),
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error("listAllUsers error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// Academic Year Management (Super-Admin)
// ─────────────────────────────────────────────────────────────────

export const createSchoolAcademicYear = async (req, res) => {
  try {
    const { school_id } = req.params;
    const { yearName, startDate, endDate, isCurrent = false } = req.body;

    if (!yearName || !startDate || !endDate) {
      return res.status(400).json({ error: "Year name, start date, and end date are required" });
    }

    const schoolCheck = await pool.query("SELECT id FROM schools WHERE id = $1", [school_id]);
    if (schoolCheck.rows.length === 0) {
      return res.status(404).json({ error: "School not found" });
    }

    // If setting as current, update all others to false for this school
    if (isCurrent) {
      await pool.query("UPDATE academic_years SET is_current = false WHERE school_id = $1", [school_id]);
    }

    const result = await pool.query(
      "INSERT INTO academic_years (year_name, start_date, end_date, is_current, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [yearName, startDate, endDate, isCurrent, school_id]
    );

    res.status(201).json({
      message: "Academic year created successfully for school",
      academicYear: result.rows[0]
    });
  } catch (error) {
    console.error("Create school academic year error:", error);
    res.status(500).json({ error: "Failed to create academic year" });
  }
};
