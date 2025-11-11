import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from "./routes/auth.routes.js";
import academicRoutes from "./routes/academic.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import assignmentsRoutes from "./routes/assignments.routes.js";
import communicationRoutes from "./routes/communication.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import feesRoutes from "./routes/fees.routes.js";

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploaded files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/communication", communicationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/fees", feesRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ERP Backend Running ✅",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "School ERP System API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      academic: "/api/academic",
      attendance: "/api/attendance", 
      assignments: "/api/assignments",
      communication: "/api/communication",
      analytics: "/api/analytics",
      upload: "/api/upload",
      health: "/api/health"
    },
    documentation: "See README.md for detailed API documentation"
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    message: `${req.method} ${req.path} is not a valid endpoint`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 School ERP API available at http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});
