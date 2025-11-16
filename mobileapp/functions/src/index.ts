import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";
import * as express from "express";
import {S3} from "aws-sdk";

// Initialize Firebase Admin
admin.initializeApp();

const app = express();
app.use(cors({origin: true}));

// Initialize S3 client for Cloudflare R2
const s3 = new S3({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  region: "auto",
  signatureVersion: "v4",
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "studenterp-documents";

// Helper function to verify Firebase token
async function verifyToken(req: express.Request): Promise<admin.auth.DecodedIdToken | null> {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return null;
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Helper function to get user role
async function getUserRole(uid: string): Promise<string | null> {
  try {
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    return userDoc.data()?.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

// Generate presigned URL for document upload
app.post("/upload-url", async (req, res) => {
  try {
    const decodedToken = await verifyToken(req);
    if (!decodedToken) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const {studentId, fileName, contentType} = req.body;
    if (!studentId || !fileName || !contentType) {
      return res.status(400).json({error: "Missing required fields"});
    }

    // Check permissions
    const userRole = await getUserRole(decodedToken.uid);
    if (!userRole || !["admin", "staff"].includes(userRole)) {
      return res.status(403).json({error: "Insufficient permissions"});
    }

    // Generate unique key
    const timestamp = Date.now();
    const key = `students/${studentId}/documents/${timestamp}-${fileName}`;

    // Generate presigned URL
    const uploadUrl = s3.getSignedUrl("putObject", {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Expires: 300, // 5 minutes
    });

    // Store document metadata in Firestore
    const docRef = admin.firestore()
        .collection("students")
        .doc(studentId)
        .collection("documents")
        .doc();

    await docRef.set({
      fileName,
      contentType,
      r2Key: key,
      uploadedBy: decodedToken.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending",
    });

    res.json({
      uploadUrl,
      documentId: docRef.id,
      key,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({error: "Internal server error"});
  }
});

// Generate presigned URL for document download
app.get("/download-url/:studentId/:documentId", async (req, res) => {
  try {
    const decodedToken = await verifyToken(req);
    if (!decodedToken) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const {studentId, documentId} = req.params;

    // Get document metadata
    const docRef = await admin.firestore()
        .collection("students")
        .doc(studentId)
        .collection("documents")
        .doc(documentId)
        .get();

    if (!docRef.exists) {
      return res.status(404).json({error: "Document not found"});
    }

    const docData = docRef.data();
    if (!docData?.r2Key) {
      return res.status(400).json({error: "Invalid document"});
    }

    // Check permissions
    const userRole = await getUserRole(decodedToken.uid);
    if (!userRole) {
      return res.status(403).json({error: "Insufficient permissions"});
    }

    // Generate presigned URL
    const downloadUrl = s3.getSignedUrl("getObject", {
      Bucket: BUCKET_NAME,
      Key: docData.r2Key,
      Expires: 300, // 5 minutes
    });

    res.json({
      downloadUrl,
      fileName: docData.fileName,
      contentType: docData.contentType,
    });
  } catch (error) {
    console.error("Error generating download URL:", error);
    res.status(500).json({error: "Internal server error"});
  }
});

// Send FCM notification
app.post("/send-notification", async (req, res) => {
  try {
    const decodedToken = await verifyToken(req);
    if (!decodedToken) {
      return res.status(401).json({error: "Unauthorized"});
    }

    // Check permissions
    const userRole = await getUserRole(decodedToken.uid);
    if (!userRole || !["admin", "staff"].includes(userRole)) {
      return res.status(403).json({error: "Insufficient permissions"});
    }

    const {title, body, data, tokens, topic} = req.body;

    let message: any = {
      notification: {title, body},
      data: data || {},
    };

    let response;
    if (tokens && tokens.length > 0) {
      // Send to specific tokens
      message.tokens = tokens;
      response = await admin.messaging().sendMulticast(message);
    } else if (topic) {
      // Send to topic
      message.topic = topic;
      response = await admin.messaging().send(message);
    } else {
      return res.status(400).json({error: "Either tokens or topic is required"});
    }

    // Log notification in Firestore
    await admin.firestore().collection("notifications").add({
      title,
      body,
      data: data || {},
      sentBy: decodedToken.uid,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      tokens: tokens || null,
      topic: topic || null,
      response: response,
    });

    res.json({success: true, response});
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({error: "Internal server error"});
  }
});

// User registration trigger
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // Create user document in Firestore
    await admin.firestore().collection("users").doc(user.uid).set({
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: "parent", // Default role, should be updated by admin
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: null,
      isActive: true,
    });

    console.log(`User document created for ${user.uid}`);
  } catch (error) {
    console.error("Error creating user document:", error);
  }
});

// Activity logging trigger
export const logActivity = functions.firestore
    .document("{collection}/{docId}")
    .onWrite(async (change, context) => {
      try {
        const {collection, docId} = context.params;
        
        // Skip logging for activityLogs collection to prevent infinite loop
        if (collection === "activityLogs") return;

        const before = change.before.exists ? change.before.data() : null;
        const after = change.after.exists ? change.after.data() : null;

        let action = "unknown";
        if (!before && after) action = "create";
        else if (before && after) action = "update";
        else if (before && !after) action = "delete";

        await admin.firestore().collection("activityLogs").add({
          collection,
          documentId: docId,
          action,
          before,
          after,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          userId: after?.updatedBy || before?.updatedBy || "system",
        });
      } catch (error) {
        console.error("Error logging activity:", error);
      }
    });

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);
