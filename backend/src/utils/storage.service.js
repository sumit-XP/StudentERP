import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

/**
 * AWS S3 Storage Service (Task 10)
 * Handles file uploads, downloads, and management in S3
 */
class StorageService {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    this.useLocalStorage = !this.bucketName || process.env.NODE_ENV === 'development';
  }

  /**
   * Upload a file to S3 (or local storage in development)
   * @param {Buffer|Stream} fileBuffer - File content
   * @param {string} key - S3 key (path)
   * @param {string} mimetype - File MIME type
   * @returns {Promise<Object>} Upload result with URL
   */
  async uploadFile(fileBuffer, key, mimetype) {
    try {
      if (this.useLocalStorage) {
        // Local storage fallback
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const localPath = path.join(uploadDir, key);
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(localPath, fileBuffer);

        return {
          key,
          url: `/uploads/${key}`,
          location: 'local',
          bucket: null
        };
      }

      // S3 upload
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
        ACL: 'private'
      });

      await this.s3Client.send(command);

      return {
        key,
        url: `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
        location: 's3',
        bucket: this.bucketName
      };
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Get a signed URL for downloading a file
   * @param {string} key - S3 key
   * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
   * @returns {Promise<string>} Signed URL
   */
  async getSignedDownloadUrl(key, expiresIn = 3600) {
    try {
      if (this.useLocalStorage) {
        return `/uploads/${key}`;
      }

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Get signed URL error:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Delete a file from storage
   * @param {string} key - S3 key
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(key) {
    try {
      if (this.useLocalStorage) {
        const localPath = path.join(process.cwd(), 'uploads', key);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
        return { key, deleted: true, location: 'local' };
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);

      return { key, deleted: true, location: 's3', bucket: this.bucketName };
    } catch (error) {
      console.error('Storage delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Generate a unique key for file upload
   * @param {string} originalName - Original file name
   * @param {string} folder - Folder path (e.g., 'documents', 'photos')
   * @returns {string} Unique S3 key
   */
  generateKey(originalName, folder = 'uploads') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${folder}/${timestamp}-${random}-${sanitizedName}`;
  }

  /**
   * Check if storage is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !this.useLocalStorage;
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default StorageService;
