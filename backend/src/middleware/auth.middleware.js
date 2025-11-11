import admin from "../config/firebase.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  // 1) Try Firebase ID token verification (preferred if coming from client SDK)
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role, // may be undefined
      userId: decoded.userId, // may be undefined
      source: "firebase",
    };
    return next();
  } catch (_) {
    // fall through to JWT verification
  }

  // 2) Fallback: verify backend-issued JWT
  try {
    const decodedJwt = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      uid: decodedJwt.uid,
      email: decodedJwt.email,
      role: decodedJwt.role,
      userId: decodedJwt.userId,
      source: "jwt",
    };
    return next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
