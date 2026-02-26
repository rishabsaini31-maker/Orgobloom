/**
 * Production-Ready Media Storage Utilities
 *
 * Features:
 * 1. Rate Limiting for uploads
 * 2. Virus Scanning integration
 * 3. Storage Quota management
 * 4. File cleanup (delete from disk)
 * 5. Resumable uploads support
 * 6. Cloud storage abstraction (S3, Supabase, Cloudinary)
 */

import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { db } from "../db/index.ts";
import { siteMedia } from "../db/schema/index.ts";
import { desc, eq, sql } from "drizzle-orm";

// ===========================
// Configuration
// ===========================

export const mediaConfig = {
  // Rate limiting
  uploadRateLimit: {
    windowMs: parseInt(process.env.UPLOAD_RATE_WINDOW_MS || "60000"), // 1 minute
    maxUploads: parseInt(process.env.MAX_UPLOADS_PER_MINUTE || "10"),
    maxSizePerWindow:
      parseInt(process.env.MAX_UPLOAD_SIZE_MB || "500") * 1024 * 1024,
  },

  // Storage quotas
  quota: {
    maxGlobalStorageGB: parseInt(process.env.MAX_GLOBAL_STORAGE_GB || "10"),
    maxUserStorageMB: parseInt(process.env.MAX_USER_STORAGE_MB || "100"),
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || "100"),
  },

  // Virus scanning
  virusScan: {
    enabled: process.env.VIRUS_SCAN_ENABLED === "true",
    clamavHost: process.env.CLAMAV_HOST || "localhost",
    clamavPort: parseInt(process.env.CLAMAV_PORT || "3310"),
  },

  // Cloud storage
  cloud: {
    provider: (process.env.CLOUD_STORAGE_PROVIDER || "supabase") as
      | "local"
      | "s3"
      | "supabase",
    s3: {
      bucket: process.env.AWS_S3_BUCKET || "",
      region: process.env.AWS_REGION || "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    supabase: {
      url: process.env.SUPABASE_URL || "",
      serviceKey: process.env.SUPABASE_SERVICE_KEY || "",
      bucket: process.env.SUPABASE_STORAGE_BUCKET || "media",
    },
  },

  // Resumable uploads
  resumable: {
    chunkSize: parseInt(process.env.UPLOAD_CHUNK_SIZE_MB || "5") * 1024 * 1024,
    tempDir:
      process.env.UPLOAD_TEMP_DIR ||
      path.resolve(process.cwd(), "uploads", "temp"),
    expireMs: parseInt(process.env.UPLOAD_EXPIRE_MS || "86400000"), // 24 hours
  },
};

// ===========================
// 1. Rate Limiting for Uploads
// ===========================

interface UploadAttempt {
  timestamp: number;
  size: number;
  ip: string;
  userId?: string;
}

const uploadAttempts: UploadAttempt[] = [];

export function checkUploadRateLimit(
  ip: string,
  userId?: string,
  fileSize: number = 0,
): { allowed: boolean; reason?: string; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - mediaConfig.uploadRateLimit.windowMs;

  // Clean old attempts
  while (
    uploadAttempts.length > 0 &&
    uploadAttempts[0].timestamp < windowStart
  ) {
    uploadAttempts.shift();
  }

  // Count attempts by IP
  const ipAttempts = uploadAttempts.filter((a) => a.ip === ip);
  const userAttempts = userId
    ? uploadAttempts.filter((a) => a.userId === userId)
    : [];

  // Check count limit
  if (ipAttempts.length >= mediaConfig.uploadRateLimit.maxUploads) {
    const oldestAttempt = ipAttempts[0];
    const retryAfter = Math.ceil(
      (oldestAttempt.timestamp + mediaConfig.uploadRateLimit.windowMs - now) /
        1000,
    );
    return {
      allowed: false,
      reason: "Too many uploads. Please try again later.",
      retryAfter,
    };
  }

  // Check size limit
  const totalSize =
    uploadAttempts.reduce((sum, a) => sum + a.size, 0) + fileSize;
  if (totalSize > mediaConfig.uploadRateLimit.maxSizePerWindow) {
    return {
      allowed: false,
      reason: "Upload size limit exceeded. Please try again later.",
    };
  }

  // Record this attempt
  uploadAttempts.push({ timestamp: now, size: fileSize, ip, userId });

  return { allowed: true };
}

// ===========================
// 2. Virus Scanning
// ===========================

export interface VirusScanResult {
  isClean: boolean;
  threat?: string;
  scanTime: number;
}

export async function scanForViruses(
  filePath: string,
): Promise<VirusScanResult> {
  const startTime = Date.now();

  if (!mediaConfig.virusScan.enabled) {
    return { isClean: true, scanTime: 0 };
  }

  try {
    // Try to use ClamAV if available (optional dependency)
    // @ts-ignore - optional dependency
    const ClamScan = require("clamscan");

    const clamscan = await new ClamScan().init({
      clamdscan: {
        host: mediaConfig.virusScan.clamavHost,
        port: mediaConfig.virusScan.clamavPort,
      },
    });

    const result = await clamscan.isInfected(filePath);

    return {
      isClean: !result.isInfected,
      threat: result.viruses?.[0],
      scanTime: Date.now() - startTime,
    };
  } catch (error) {
    // If ClamAV is not available, do basic checks
    console.warn("Virus scanner not available, doing basic checks:", error);

    // Basic file validation
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Check for suspicious extensions
    const suspiciousExtensions = [
      ".exe",
      ".bat",
      ".cmd",
      ".sh",
      ".ps1",
      ".vbs",
      ".js",
      ".jar",
    ];
    if (suspiciousExtensions.includes(ext)) {
      return {
        isClean: false,
        threat: `Suspicious file extension: ${ext}`,
        scanTime: Date.now() - startTime,
      };
    }

    // Check for embedded scripts in media files
    const buffer = Buffer.alloc(1024);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 1024, 0);
    fs.closeSync(fd);

    const header = buffer.toString("utf8").toLowerCase();
    const suspiciousPatterns = [
      "<script",
      "javascript:",
      "data:text/html",
      "<?php",
      "<%",
    ];

    for (const pattern of suspiciousPatterns) {
      if (header.includes(pattern)) {
        return {
          isClean: false,
          threat: "Suspicious content detected in file header",
          scanTime: Date.now() - startTime,
        };
      }
    }

    return { isClean: true, scanTime: Date.now() - startTime };
  }
}

// ===========================
// 3. Storage Quota Management
// ===========================

export interface StorageQuota {
  usedBytes: number;
  maxBytes: number;
  availableBytes: number;
  usagePercent: number;
}

export async function getGlobalStorageUsage(): Promise<StorageQuota> {
  const maxBytes = mediaConfig.quota.maxGlobalStorageGB * 1024 * 1024 * 1024;

  // Calculate from disk usage
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  let usedBytes = 0;

  try {
    if (fs.existsSync(uploadsDir)) {
      const calculateDirSize = (dir: string): number => {
        let size = 0;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          size += stats.isDirectory() ? calculateDirSize(filePath) : stats.size;
        }
        return size;
      };
      usedBytes = calculateDirSize(uploadsDir);
    }

    return {
      usedBytes,
      maxBytes,
      availableBytes: Math.max(0, maxBytes - usedBytes),
      usagePercent: (usedBytes / maxBytes) * 100,
    };
  } catch (error) {
    console.error("Error calculating storage usage:", error);

    return {
      usedBytes,
      maxBytes,
      availableBytes: Math.max(0, maxBytes - usedBytes),
      usagePercent: (usedBytes / maxBytes) * 100,
    };
  }
}

export async function checkStorageQuota(
  fileSize: number,
  userId?: string,
): Promise<{ allowed: boolean; reason?: string; quota?: StorageQuota }> {
  const globalQuota = await getGlobalStorageUsage();

  if (fileSize > globalQuota.availableBytes) {
    return {
      allowed: false,
      reason: "Insufficient storage space. Please contact administrator.",
      quota: globalQuota,
    };
  }

  if (fileSize > mediaConfig.quota.maxFileSizeMB * 1024 * 1024) {
    return {
      allowed: false,
      reason: `File size exceeds maximum allowed (${mediaConfig.quota.maxFileSizeMB}MB)`,
    };
  }

  return { allowed: true, quota: globalQuota };
}

// ===========================
// 4. File Cleanup Utility
// ===========================

export interface FileInfo {
  path: string;
  size: number;
  createdAt: Date;
  isOrphaned: boolean;
}

export async function findOrphanedFiles(): Promise<FileInfo[]> {
  const orphanedFiles: FileInfo[] = [];
  const uploadsDir = path.resolve(process.cwd(), "uploads");

  if (!fs.existsSync(uploadsDir)) {
    return orphanedFiles;
  }

  // Get all files from database
  const dbFiles = await db.select().from(siteMedia);
  const dbFilePaths = new Set<string>();

  for (const record of dbFiles) {
    // Extract file paths from URLs
    if (record.introVideoUrl) {
      const filename = path.basename(new URL(record.introVideoUrl).pathname);
      dbFilePaths.add(filename);
    }
    if (record.introVideoUrls) {
      const urls = JSON.parse(record.introVideoUrls) as string[];
      for (const url of urls) {
        try {
          const filename = path.basename(new URL(url).pathname);
          dbFilePaths.add(filename);
        } catch {}
      }
    }
    if ((record as any).introVideoPoster) {
      try {
        const filename = path.basename(
          new URL((record as any).introVideoPoster).pathname,
        );
        dbFilePaths.add(filename);
      } catch {}
    }
  }

  // Scan directories for orphaned files
  const scanDir = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        scanDir(filePath);
      } else {
        if (!dbFilePaths.has(file)) {
          orphanedFiles.push({
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            isOrphaned: true,
          });
        }
      }
    }
  };

  scanDir(uploadsDir);

  return orphanedFiles;
}

export async function deleteFileFromDisk(filePath: string): Promise<boolean> {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    return false;
  }
}

export async function cleanupOrphanedFiles(
  olderThanDays: number = 7,
): Promise<{ deleted: string[]; errors: string[] }> {
  const result = { deleted: [] as string[], errors: [] as string[] };
  const orphanedFiles = await findOrphanedFiles();
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  for (const file of orphanedFiles) {
    if (file.createdAt < cutoffDate) {
      const deleted = await deleteFileFromDisk(file.path);
      if (deleted) {
        result.deleted.push(file.path);
      } else {
        result.errors.push(file.path);
      }
    }
  }

  return result;
}

// ===========================
// 5. Resumable Upload Support
// ===========================

export interface ChunkInfo {
  uploadId: string;
  filename: string;
  totalChunks: number;
  uploadedChunks: number[];
  chunkSize: number;
  totalSize: number;
  mimeType: string;
  createdAt: number;
  userId?: string;
}

const activeUploads = new Map<string, ChunkInfo>();

export function generateUploadId(): string {
  return createHash("sha256")
    .update(`${Date.now()}-${Math.random()}`)
    .digest("hex")
    .substring(0, 32);
}

export function initResumableUpload(
  filename: string,
  totalSize: number,
  mimeType: string,
  userId?: string,
): ChunkInfo {
  const uploadId = generateUploadId();
  const chunkSize = mediaConfig.resumable.chunkSize;
  const totalChunks = Math.ceil(totalSize / chunkSize);

  const info: ChunkInfo = {
    uploadId,
    filename,
    totalChunks,
    uploadedChunks: [],
    chunkSize,
    totalSize,
    mimeType,
    createdAt: Date.now(),
    userId,
  };

  // Ensure temp directory exists
  if (!fs.existsSync(mediaConfig.resumable.tempDir)) {
    fs.mkdirSync(mediaConfig.resumable.tempDir, { recursive: true });
  }

  activeUploads.set(uploadId, info);

  return info;
}

export function getUploadInfo(uploadId: string): ChunkInfo | undefined {
  return activeUploads.get(uploadId);
}

export function saveChunk(
  uploadId: string,
  chunkIndex: number,
  chunkData: Buffer,
): { success: boolean; uploadedChunks: number[]; isComplete: boolean } {
  const info = activeUploads.get(uploadId);
  if (!info) {
    throw new Error("Upload session not found");
  }

  // Save chunk to temp file
  const chunkPath = path.join(
    mediaConfig.resumable.tempDir,
    `${uploadId}.${chunkIndex}`,
  );
  fs.writeFileSync(chunkPath, chunkData);

  // Track uploaded chunk
  if (!info.uploadedChunks.includes(chunkIndex)) {
    info.uploadedChunks.push(chunkIndex);
  }

  const isComplete = info.uploadedChunks.length === info.totalChunks;

  return {
    success: true,
    uploadedChunks: info.uploadedChunks,
    isComplete,
  };
}

export function assembleChunks(uploadId: string, finalPath: string): Buffer {
  const info = activeUploads.get(uploadId);
  if (!info) {
    throw new Error("Upload session not found");
  }

  const chunks: Buffer[] = [];

  for (let i = 0; i < info.totalChunks; i++) {
    const chunkPath = path.join(
      mediaConfig.resumable.tempDir,
      `${uploadId}.${i}`,
    );
    if (!fs.existsSync(chunkPath)) {
      throw new Error(`Missing chunk ${i}`);
    }
    chunks.push(fs.readFileSync(chunkPath));

    // Delete chunk after reading
    fs.unlinkSync(chunkPath);
  }

  const finalBuffer = Buffer.concat(chunks);
  fs.writeFileSync(finalPath, finalBuffer);

  // Cleanup upload session
  activeUploads.delete(uploadId);

  return finalBuffer;
}

export function cleanupExpiredUploads(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [uploadId, info] of activeUploads) {
    if (now - info.createdAt > mediaConfig.resumable.expireMs) {
      // Delete all chunks
      for (let i = 0; i < info.totalChunks; i++) {
        const chunkPath = path.join(
          mediaConfig.resumable.tempDir,
          `${uploadId}.${i}`,
        );
        if (fs.existsSync(chunkPath)) {
          fs.unlinkSync(chunkPath);
        }
      }
      activeUploads.delete(uploadId);
      cleaned++;
    }
  }

  return cleaned;
}

// ===========================
// 6. Cloud Storage Abstraction (Supabase only)
// ===========================

export interface CloudUploadResult {
  url: string;
  key: string;
  provider: string;
  size: number;
}

export interface CloudStorageProvider {
  upload(
    filePath: string,
    key: string,
    mimeType: string,
  ): Promise<CloudUploadResult>;
  delete(key: string): Promise<boolean>;
  getUrl(key: string): string;
}

class LocalStorageProvider implements CloudStorageProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BASE_URL || "http://localhost:5000";
  }

  async upload(
    filePath: string,
    key: string,
    _mimeType: string,
  ): Promise<CloudUploadResult> {
    const destDir = path.resolve(process.cwd(), "uploads", path.dirname(key));
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const destPath = path.resolve(process.cwd(), "uploads", key);
    fs.copyFileSync(filePath, destPath);

    const stats = fs.statSync(destPath);

    return {
      url: `${this.baseUrl}/uploads/${key}`,
      key,
      provider: "local",
      size: stats.size,
    };
  }

  async delete(key: string): Promise<boolean> {
    const filePath = path.resolve(process.cwd(), "uploads", key);
    return deleteFileFromDisk(filePath);
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/uploads/${key}`;
  }
}

class S3StorageProvider implements CloudStorageProvider {
  async upload(
    filePath: string,
    key: string,
    mimeType: string,
  ): Promise<CloudUploadResult> {
    // @ts-ignore - optional dependency
    const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

    const client = new S3Client({
      region: mediaConfig.cloud.s3.region,
      credentials: {
        accessKeyId: mediaConfig.cloud.s3.accessKeyId,
        secretAccessKey: mediaConfig.cloud.s3.secretAccessKey,
      },
    });

    const fileBuffer = fs.readFileSync(filePath);

    await client.send(
      new PutObjectCommand({
        Bucket: mediaConfig.cloud.s3.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      }),
    );

    return {
      url: `https://${mediaConfig.cloud.s3.bucket}.s3.${mediaConfig.cloud.s3.region}.amazonaws.com/${key}`,
      key,
      provider: "s3",
      size: fileBuffer.length,
    };
  }

  async delete(key: string): Promise<boolean> {
    // @ts-ignore - optional dependency
    const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

    const client = new S3Client({
      region: mediaConfig.cloud.s3.region,
      credentials: {
        accessKeyId: mediaConfig.cloud.s3.accessKeyId,
        secretAccessKey: mediaConfig.cloud.s3.secretAccessKey,
      },
    });

    await client.send(
      new DeleteObjectCommand({
        Bucket: mediaConfig.cloud.s3.bucket,
        Key: key,
      }),
    );

    return true;
  }

  getUrl(key: string): string {
    return `https://${mediaConfig.cloud.s3.bucket}.s3.${mediaConfig.cloud.s3.region}.amazonaws.com/${key}`;
  }
}

class SupabaseStorageProvider implements CloudStorageProvider {
  async upload(
    filePath: string,
    key: string,
    mimeType: string,
  ): Promise<CloudUploadResult> {
    const { createClient } = await import("@supabase/supabase-js");

    const supabase = createClient(
      mediaConfig.cloud.supabase.url,
      mediaConfig.cloud.supabase.serviceKey,
    );

    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from(mediaConfig.cloud.supabase.bucket)
      .upload(key, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from(mediaConfig.cloud.supabase.bucket)
      .getPublicUrl(key);

    return {
      url: urlData.publicUrl,
      key: data.path,
      provider: "supabase",
      size: fileBuffer.length,
    };
  }

  async delete(key: string): Promise<boolean> {
    const { createClient } = await import("@supabase/supabase-js");

    const supabase = createClient(
      mediaConfig.cloud.supabase.url,
      mediaConfig.cloud.supabase.serviceKey,
    );

    const { error } = await supabase.storage
      .from(mediaConfig.cloud.supabase.bucket)
      .remove([key]);

    return !error;
  }

  getUrl(key: string): string {
    return `${mediaConfig.cloud.supabase.url}/storage/v1/object/public/${mediaConfig.cloud.supabase.bucket}/${key}`;
  }
}

class CloudinaryStorageProvider implements CloudStorageProvider {
  async upload(
    filePath: string,
    key: string,
    mimeType: string,
  ): Promise<CloudUploadResult> {
    // @ts-ignore - optional dependency
    const cloudinary = require("cloudinary").v2;

    cloudinary.config({
      cloud_name: mediaConfig.cloud.cloudinary.cloudName,
      api_key: mediaConfig.cloud.cloudinary.apiKey,
      api_secret: mediaConfig.cloud.cloudinary.apiSecret,
    });

    const result = await cloudinary.uploader.upload(filePath, {
      public_id: key.replace(/\//g, "/"),
      resource_type: mimeType.startsWith("video") ? "video" : "image",
    });

    return {
      url: result.secure_url,
      key: result.public_id,
      provider: "cloudinary",
      size: result.bytes,
    };
  }

  async delete(key: string): Promise<boolean> {
    // @ts-ignore - optional dependency
    const cloudinary = require("cloudinary").v2;

    cloudinary.config({
      cloud_name: mediaConfig.cloud.cloudinary.cloudName,
      api_key: mediaConfig.cloud.cloudinary.apiKey,
      api_secret: mediaConfig.cloud.cloudinary.apiSecret,
    });

    await cloudinary.uploader.destroy(key);
    return true;
  }

  getUrl(key: string): string {
    return `https://res.cloudinary.com/${mediaConfig.cloud.cloudinary.cloudName}/image/upload/${key}`;
  }
}

// Factory function to get the appropriate storage provider
export function getStorageProvider(): CloudStorageProvider {
  switch (mediaConfig.cloud.provider) {
    case "s3":
      return new S3StorageProvider();
    case "supabase":
      return new SupabaseStorageProvider();
    case "cloudinary":
      return new CloudinaryStorageProvider();
    default:
      return new LocalStorageProvider();
  }
}

// ===========================
// Utility Functions
// ===========================

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return createHash("sha256").update(fileBuffer).digest("hex");
}

export function validateMimeType(
  filePath: string,
  expectedTypes: string[],
): boolean {
  const buffer = Buffer.alloc(12);
  const fd = fs.openSync(filePath, "r");
  fs.readSync(fd, buffer, 0, 12, 0);
  fs.closeSync(fd);

  // Check magic numbers
  const magicNumbers: Record<string, number[]> = {
    "image/jpeg": [0xff, 0xd8, 0xff],
    "image/png": [0x89, 0x50, 0x4e, 0x47],
    "image/webp": [0x52, 0x49, 0x46, 0x46],
    "video/mp4": [0x00, 0x00, 0x00, 0x00, 0x66, 0x74, 0x79, 0x70],
    "video/webm": [0x1a, 0x45, 0xdf, 0xa3],
  };

  for (const type of expectedTypes) {
    const magic = magicNumbers[type];
    if (magic) {
      const matches = magic.every((byte, i) => buffer[i] === byte);
      if (matches) return true;
    }
  }

  return false;
}
