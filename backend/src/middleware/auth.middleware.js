import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decodedJwt = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decodedJwt.userId || decodedJwt.id,
      userId: decodedJwt.userId || decodedJwt.id,
      uid: decodedJwt.uid,
      email: decodedJwt.email,
      role: decodedJwt.role,
      school_id: decodedJwt.school_id || null,
      source: "jwt",
    };
    return next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
