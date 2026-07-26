import crypto from "crypto";
import bcrypt from "bcrypt";
import pool from "../../config/db.js";
import jwt from "jsonwebtoken";
import { getSchoolByCodeOrId } from "../../utils/tenant-utils.js";

const canCreateRole = (actorRole, targetRole) => {
  if (actorRole === "super_admin") return ["admin", "super_admin"].includes(targetRole);
  if (actorRole === "admin") return ["admin", "teacher", "student", "parent"].includes(targetRole);
  if (actorRole === "teacher") return ["student", "parent"].includes(targetRole);
  return false;
};

// Register User — controlled tenant user creation
export const registerUser = async (req, res) => {
  try {
    const { email, password, name, role, school_id, schoolCode, school_code, phone, address, dateOfBirth, gender } = req.body;
    const actorRole = req.user?.role;
    
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "email, password, name, and role are required" });
    }

    if (!canCreateRole(actorRole, role)) {
      return res.status(403).json({ error: "You cannot create this role" });
    }

    let school = null;
    if (role !== "super_admin") {
      if (actorRole === "super_admin") {
        school = await getSchoolByCodeOrId(school_id || schoolCode || school_code);
        if (!school) return res.status(400).json({ error: "Valid 5 digit school ID is required" });
      } else {
        school = await getSchoolByCodeOrId(req.user?.school_id);
        if (!school) return res.status(400).json({ error: "Your account is not linked to a school" });
      }

      if (!school.is_active) return res.status(403).json({ error: "School account is suspended" });
    }

    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "User already registered" });
    }

    const roleQuery = await pool.query("SELECT id FROM roles WHERE name = $1", [role]);
    if (roleQuery.rows.length === 0) return res.status(400).json({ error: "Invalid role specified" });
    const roleId = roleQuery.rows[0].id;

    const uid = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (uid, password_hash, email, name, role_id, school_id, phone, address, date_of_birth, gender) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, email, name, school_id, is_active, created_at`,
      [
        uid,
        passwordHash,
        email,
        name,
        roleId,
        school?.id || null,
        phone || null,
        address || null,
        dateOfBirth || null,
        gender || null
      ]
    );

    res.status(201).json({ 
      message: "User created successfully", 
      user: { ...result.rows[0], role, school_code: school?.school_code || null, school_name: school?.name || null },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Login User — school_id embedded in JWT
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const userQuery = await pool.query(
      `SELECT u.*, r.name as role_name, s.school_code, s.name as school_name
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       LEFT JOIN schools s ON u.school_id = s.id
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "User not found or inactive" });
    }

    const user = userQuery.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const uid = user.uid;

    // Guard: verify school is active
    if (user.school_id) {
      const schoolCheck = await pool.query("SELECT is_active FROM schools WHERE id = $1", [user.school_id]);
      if (schoolCheck.rows.length > 0 && !schoolCheck.rows[0].is_active) {
        return res.status(403).json({ 
          error: "School account suspended",
          message: "Your school account has been suspended. Contact your administrator.",
        });
      }
    }

    // JWT with school_id (tenant context)
    const jwtToken = jwt.sign(
      { uid, email, role: user.role_name, userId: user.id, school_id: user.school_id || null },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

        res.json({
      message: "Login successful",
      token: jwtToken,
      user: {
        id: user.id, uid, email: user.email, name: user.name,
        role: user.role_name, school_id: user.school_id,
        schoolCode: user.school_code || null,
        schoolName: user.school_name || null,
        phone: user.phone, profileImage: user.profile_image_url,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: "Invalid token or authentication failed" });
  }
};

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    const userQuery = await pool.query(
      `SELECT u.*, r.name as role_name, s.school_code, s.name as school_name FROM users u 
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN schools s ON u.school_id = s.id
       WHERE u.uid = $1`,
      [uid]
    );
    if (userQuery.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const user = userQuery.rows[0];
    res.json({
      user: {
        id: user.id, uid: user.uid, email: user.email, name: user.name,
        phone: user.phone, address: user.address, dateOfBirth: user.date_of_birth,
        gender: user.gender, role: user.role_name, school_id: user.school_id,
        schoolCode: user.school_code || null, schoolName: user.school_name || null,
        profileImage: user.profile_image_url, isActive: user.is_active, createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, phone, address, dateOfBirth, gender, profileImage } = req.body;
    const result = await pool.query(
      `UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone), address=COALESCE($3,address),
       date_of_birth=COALESCE($4,date_of_birth), gender=COALESCE($5,gender),
       profile_image_url=COALESCE($6,profile_image_url), updated_at=CURRENT_TIMESTAMP
       WHERE uid=$7 RETURNING *`,
      [
        name || null, 
        phone || null, 
        address || null, 
        dateOfBirth || null, 
        gender || null, 
        profileImage || null, 
        uid
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "Profile updated successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { uid } = req.user;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE uid = $2", [passwordHash, uid]);
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// Logout User
export const logoutUser = async (req, res) => {
  try {
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

// Get All Users — TENANT SCOPED
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const tenantId = req.user?.school_id || null;
    const isSuperAdmin = req.user?.role === "super_admin";

    let queryStr = `
      SELECT u.id, u.uid, u.name, u.email, u.phone, u.address,
        u.date_of_birth, u.gender, u.profile_image_url, u.role_id,
        u.school_id, u.is_active, u.created_at, u.updated_at,
        r.name as role_name,
        s.school_code, s.name as school_name,
        t.employee_id as employee_id
      FROM users u 
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN teachers t ON t.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    if (!isSuperAdmin && tenantId) {
      paramCount++;
      queryStr += ` AND u.school_id = $${paramCount}`;
      queryParams.push(tenantId);
    }
    if (role) {
      paramCount++;
      queryStr += ` AND r.name = $${paramCount}`;
      queryParams.push(role);
    }
    if (search) {
      paramCount++;
      queryStr += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    queryStr += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limitNum, offset);
    const result = await pool.query(queryStr, queryParams);

    let countStr = `SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE 1=1`;
    const countParams = [];
    let countParamCount = 0;
    if (!isSuperAdmin && tenantId) {
      countParamCount++;
      countStr += ` AND u.school_id = $${countParamCount}`;
      countParams.push(tenantId);
    }
    if (role) {
      countParamCount++;
      countStr += ` AND r.name = $${countParamCount}`;
      countParams.push(role);
    }
    if (search) {
      countParamCount++;
      countStr += ` AND (u.name ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countStr, countParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
