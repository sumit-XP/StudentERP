import admin from "../../config/firebase.js";
import pool from "../../config/db.js";
import jwt from "jsonwebtoken";

// Register User
export const registerUser = async (req, res) => {
  try {
    const { email, password, name, role, phone, address, dateOfBirth, gender } = req.body;
    
    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "Email, password, name, and role are required" });
    }

    // Create user in Firebase
    const userRecord = await admin.auth().createUser({ 
      email, 
      password, 
      displayName: name 
    });

    // Get role ID
    const roleQuery = await pool.query("SELECT id FROM roles WHERE name = $1", [role]);
    if (roleQuery.rows.length === 0) {
      return res.status(400).json({ error: "Invalid role specified" });
    }
    const roleId = roleQuery.rows[0].id;

    // Insert user into database
    await pool.query(
      `INSERT INTO users (firebase_uid, email, name, role_id, phone, address, date_of_birth, gender) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userRecord.uid, email, name, roleId, phone, address, dateOfBirth, gender]
    );

    res.status(201).json({ 
      message: "User registered successfully", 
      uid: userRecord.uid,
      email: email,
      name: name,
      role: role
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: "ID token is required" });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // Get user details from database
    const userQuery = await pool.query(
      `SELECT u.*, r.name as role_name FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.firebase_uid = $1 AND u.is_active = true`,
      [uid]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "User not found or inactive" });
    }

    const user = userQuery.rows[0];

    // Generate JWT token for API access
    const jwtToken = jwt.sign(
      { 
        uid: uid, 
        email: email, 
        role: user.role_name,
        userId: user.id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: "Login successful",
      token: jwtToken,
      user: {
        id: user.id,
        uid: uid,
        email: user.email,
        name: user.name,
        role: user.role_name,
        phone: user.phone,
        profileImage: user.profile_image_url
      }
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
      `SELECT u.*, r.name as role_name FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.firebase_uid = $1`,
      [uid]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userQuery.rows[0];
    
    res.json({
      user: {
        id: user.id,
        uid: user.firebase_uid,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        role: user.role_name,
        profileImage: user.profile_image_url,
        isActive: user.is_active,
        createdAt: user.created_at
      }
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

    // Update user in database
    const updateQuery = `
      UPDATE users 
      SET name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          address = COALESCE($3, address),
          date_of_birth = COALESCE($4, date_of_birth),
          gender = COALESCE($5, gender),
          profile_image_url = COALESCE($6, profile_image_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid = $7
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      name, phone, address, dateOfBirth, gender, profileImage, uid
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update Firebase user display name if provided
    if (name) {
      await admin.auth().updateUser(uid, { displayName: name });
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0]
    });
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

    // Update password in Firebase
    await admin.auth().updateUser(uid, { password: newPassword });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// Logout User (optional - mainly for token blacklisting if implemented)
export const logoutUser = async (req, res) => {
  try {
    // In a more advanced implementation, you might want to blacklist the JWT token
    // For now, we'll just send a success response
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

// Get All Users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE 1=1
    `;
    const queryParams = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      query += ` AND r.name = $${paramCount}`;
      queryParams.push(role);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (role) {
      countParamCount++;
      countQuery += ` AND r.name = $${countParamCount}`;
      countParams.push(role);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (u.name ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers: totalUsers,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
