import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getSchoolByCodeOrId } from "../utils/tenant-utils.js";
dotenv.config();

/**
 * Multi-tenant middleware for StudentERP.
 *
 * Enforces that every authenticated request operates within a single
 * tenant (school). The school_id is read from the JWT payload and
 * attached to req.tenantId for use in all downstream controllers.
 *
 * Behaviour:
 *  - super_admin  → can access any school; optionally pass ?school_id= body/query to scope
 *  - all other roles → must have school_id in JWT; sets req.tenantId
 */
export const scopeToSchool = (req, res, next) => {
  Promise.resolve().then(async () => {
    const { role, school_id } = req.user || {};

    if (role === "super_admin") {
      const targetSchool = req.query.school_id || req.query.schoolCode || req.query.school_code || req.body?.school_id || req.body?.schoolCode || req.body?.school_code || null;
      if (!targetSchool) {
        req.tenantId = null;
        return next();
      }
      const school = await getSchoolByCodeOrId(targetSchool);
      if (!school) return res.status(404).json({ error: "School not found" });
      req.tenantId = school.id;
      return next();
    }

    if (!school_id) {
      return res.status(400).json({
        error: "School context required",
        message:
          "Your account is not associated with a school. Please contact your administrator.",
      });
    }

    req.tenantId = school_id;
    next();
  }).catch(next);
};

/**
 * Middleware that verifies the tenant school is active.
 * Must be used AFTER scopeToSchool.
 */
export const requireActiveSchool = async (req, res, next) => {
  if (!req.tenantId) return next(); // super_admin without school scope

  try {
    const { default: pool } = await import("../config/db.js");
    const result = await pool.query(
      "SELECT is_active FROM schools WHERE id = $1",
      [req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "School not found" });
    }

    if (!result.rows[0].is_active) {
      return res.status(403).json({
        error: "School account suspended",
        message: "This school account has been suspended. Please contact support.",
      });
    }

    next();
  } catch (error) {
    console.error("requireActiveSchool error:", error);
    next(error);
  }
};
