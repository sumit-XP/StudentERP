import pool from "../config/db.js";

export const checkRole = (allowedRoles) => async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const user = await pool.query(
      `SELECT r.name as role FROM users u 
       JOIN roles r ON u.role_id = r.id WHERE uid = $1`,
      [uid]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { role } = user.rows[0];

    // Attach to request for downstream middleware
    req.user.role = role;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    console.error("Role check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/** Alias: requireRole(role) — matches EDU backend convention */
export const requireRole = (roleOrRoles) => {
  const allowed = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  return checkRole(allowed);
};
