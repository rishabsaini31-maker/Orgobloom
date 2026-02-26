/**
 * Production-Ready Site Media Routes
 *
 * Features:
 * 1. Rate Limiting for uploads
 * 2. Virus Scanning integration
 * 3. Storage Quota management
 * 4. File cleanup (delete from disk)
 * 5. Resumable uploads support
 * 6. Cloud storage abstraction
 */

import { Router, Response, NextFunction } from "express";
import { db } from "@/db";
import { siteMedia } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "@/middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createId } from "@paralleldrive/cuid2";
import {
  checkUploadRateLimit,
  scanForViruses,
  checkStorageQuota,
  deleteFileFromDisk,
  cleanupOrphanedFiles,
  getStorageProvider,
  initResumableUpload,
  getUploadInfo,
  saveChunk,
  assembleChunks,
  cleanupExpiredUploads,
  formatBytes,
  mediaConfig,
} from "@/utils/mediaStorage";

const router = Router();

// ===========================
// Helper Functions
// ===========================

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const videosDir = path.resolve(process.cwd(), "uploads", "videos");
ensureDir(videosDir);

const imagesDir = path.resolve(process.cwd(), "uploads", "images");
ensureDir(imagesDir);

// ===========================
// Video Upload Configuration
// ===========================

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, videosDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".mp4";
    cb(null, `${createId()}${ext}`);
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: mediaConfig.quota.maxFileSizeMB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/ogg"];
    const isAllowed = allowedTypes.includes(file.mimetype);
    if (!isAllowed) {
      return cb(new Error("Only MP4, WebM, and OGG videos are allowed"));
    }
    cb(null, true);
  },
});

// ===========================
// Image Upload Configuration
// ===========================

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imagesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `intro-poster${ext}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const isAllowed = allowedTypes.includes(file.mimetype);
    if (!isAllowed) {
      return cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
    cb(null, true);
  },
});

// ===========================
// Default Videos (Production)
// ===========================

const DEFAULT_VIDEO_URLS = [
  "https://wfmmdkknrigkhdpldwhc.supabase.co/storage/v1/object/public/videos/a-seamless-animation-sequence-showing-1-a-close-up%20(1).mp4",
  "https://wfmmdkknrigkhdpldwhc.supabase.co/storage/v1/object/public/videos/close-up-of-hands-gently-mixing-organic-fertilizer.mp4",
];

// ===========================
// Routes
// ===========================

// Get all intro videos
router.get(
  "/intro-videos",
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [latest] = await db
        .select()
        .from(siteMedia)
        .orderBy(desc(siteMedia.updatedAt))
        .limit(1);

      const videoUrls = latest?.introVideoUrls
        ? JSON.parse(latest.introVideoUrls)
        : latest?.introVideoUrl
          ? [latest.introVideoUrl]
          : [];

      if (videoUrls.length === 0) {
        return res.json({ videos: DEFAULT_VIDEO_URLS });
      }

      res.json({ videos: videoUrls });
    } catch (error) {
      console.error("Error fetching intro videos:", error);
      res.json({ videos: DEFAULT_VIDEO_URLS });
    }
  },
);

// Get storage usage
router.get(
  "/storage-usage",
  authenticate,
  isAdmin,
  async (_req: AuthRequest, res: Response) => {
    const { getGlobalStorageUsage } = await import("@/utils/mediaStorage");
    const quota = await getGlobalStorageUsage();
    res.json({
      used: formatBytes(quota.usedBytes),
      max: formatBytes(quota.maxBytes),
      available: formatBytes(quota.availableBytes),
      usagePercent: quota.usagePercent.toFixed(2),
    });
  },
);

// Initialize resumable upload
router.post(
  "/resumable/init",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { filename, totalSize, mimeType } = req.body;

      if (!filename || !totalSize || !mimeType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check storage quota
      const quotaCheck = await checkStorageQuota(totalSize, req.user?.id);
      if (!quotaCheck.allowed) {
        return res.status(413).json({ error: quotaCheck.reason });
      }

      // Check rate limit
      const ip = req.ip || "unknown";
      const rateCheck = checkUploadRateLimit(ip, req.user?.id, totalSize);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          error: rateCheck.reason,
          retryAfter: rateCheck.retryAfter,
        });
      }

      const info = initResumableUpload(
        filename,
        totalSize,
        mimeType,
        req.user?.id,
      );

      res.json({
        uploadId: info.uploadId,
        chunkSize: info.chunkSize,
        totalChunks: info.totalChunks,
      });
    } catch (error) {
      console.error("Error initializing resumable upload:", error);
      res.status(500).json({ error: "Failed to initialize upload" });
    }
  },
);

// Upload chunk
router.post(
  "/resumable/chunk",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { uploadId, chunkIndex } = req.body;

      if (!uploadId || chunkIndex === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const info = getUploadInfo(uploadId);
      if (!info) {
        return res.status(404).json({ error: "Upload session not found" });
      }

      // Get chunk data from request
      const chunkData = req.file?.buffer;
      if (!chunkData) {
        return res.status(400).json({ error: "No chunk data provided" });
      }

      const result = saveChunk(uploadId, parseInt(chunkIndex), chunkData);

      res.json({
        success: result.success,
        uploadedChunks: result.uploadedChunks,
        isComplete: result.isComplete,
      });
    } catch (error) {
      console.error("Error uploading chunk:", error);
      res.status(500).json({ error: "Failed to upload chunk" });
    }
  },
);

// Complete resumable upload
router.post(
  "/resumable/complete",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { uploadId } = req.body;

      if (!uploadId) {
        return res.status(400).json({ error: "Missing uploadId" });
      }

      const info = getUploadInfo(uploadId);
      if (!info) {
        return res.status(404).json({ error: "Upload session not found" });
      }

      // Assemble chunks into final file
      const finalFilename = `${createId()}${path.extname(info.filename)}`;
      const finalPath = path.join(videosDir, finalFilename);

      assembleChunks(uploadId, finalPath);

      // Scan for viruses
      const scanResult = await scanForViruses(finalPath);
      if (!scanResult.isClean) {
        await deleteFileFromDisk(finalPath);
        return res.status(400).json({
          error: "File failed virus scan",
          threat: scanResult.threat,
        });
      }

      // Upload to cloud storage if configured
      const storageProvider = getStorageProvider();
      const cloudResult = await storageProvider.upload(
        finalPath,
        `videos/${finalFilename}`,
        info.mimeType,
      );

      // Delete local file if using cloud storage
      if (mediaConfig.cloud.provider !== "local") {
        await deleteFileFromDisk(finalPath);
      }

      // Save to database
      const videoUrl = cloudResult.url;

      const [existing] = await db
        .select()
        .from(siteMedia)
        .orderBy(desc(siteMedia.updatedAt))
        .limit(1);

      if (existing) {
        const existingUrls = existing.introVideoUrls
          ? JSON.parse(existing.introVideoUrls)
          : [];
        const newUrls = [...existingUrls, videoUrl];

        await db
          .update(siteMedia)
          .set({
            introVideoUrls: JSON.stringify(newUrls),
            introVideoUrl: newUrls[0],
            updatedAt: new Date(),
          })
          .where(eq(siteMedia.id, existing.id));

        return res.json({
          url: videoUrl,
          videos: newUrls,
          message: "Video uploaded successfully",
        });
      }

      await db.insert(siteMedia).values({
        id: createId(),
        introVideoUrls: JSON.stringify([videoUrl]),
        introVideoUrl: videoUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(201).json({
        url: videoUrl,
        videos: [videoUrl],
        message: "Video uploaded successfully",
      });
    } catch (error) {
      console.error("Error completing upload:", error);
      res.status(500).json({ error: "Failed to complete upload" });
    }
  },
);

// Upload multiple videos (1-5) - Standard upload with all features
router.post(
  "/intro-videos",
  authenticate,
  isAdmin,
  videoUpload.array("videos", 5),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const files = req.files as
        | {
            filename: string;
            originalname: string;
            mimetype: string;
            path: string;
            size: number;
          }[]
        | undefined;

      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one video file is required" });
      }

      if (files.length > 5) {
        // Clean up uploaded files
        for (const file of files) {
          await deleteFileFromDisk(file.path);
        }
        return res.status(400).json({ error: "Maximum 5 videos allowed" });
      }

      // Check rate limit
      const ip = req.ip || "unknown";
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      const rateCheck = checkUploadRateLimit(ip, req.user?.id, totalSize);
      if (!rateCheck.allowed) {
        // Clean up uploaded files
        for (const file of files) {
          await deleteFileFromDisk(file.path);
        }
        return res.status(429).json({
          error: rateCheck.reason,
          retryAfter: rateCheck.retryAfter,
        });
      }

      // Check storage quota
      const quotaCheck = await checkStorageQuota(totalSize, req.user?.id);
      if (!quotaCheck.allowed) {
        // Clean up uploaded files
        for (const file of files) {
          await deleteFileFromDisk(file.path);
        }
        return res.status(413).json({ error: quotaCheck.reason });
      }

      // Scan all files for viruses
      for (const file of files) {
        const scanResult = await scanForViruses(file.path);
        if (!scanResult.isClean) {
          // Clean up all uploaded files
          for (const f of files) {
            await deleteFileFromDisk(f.path);
          }
          return res.status(400).json({
            error: `File ${file.originalname} failed virus scan`,
            threat: scanResult.threat,
          });
        }
      }

      // Upload to cloud storage if configured
      const storageProvider = getStorageProvider();
      const videoUrls: string[] = [];

      for (const file of files) {
        const cloudResult = await storageProvider.upload(
          file.path,
          `videos/${file.filename}`,
          file.mimetype,
        );
        videoUrls.push(cloudResult.url);

        // Delete local file if using cloud storage
        if (mediaConfig.cloud.provider !== "local") {
          await deleteFileFromDisk(file.path);
        }
      }

      // Update database
      const [existing] = await db
        .select()
        .from(siteMedia)
        .orderBy(desc(siteMedia.updatedAt))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(siteMedia)
          .set({
            introVideoUrls: JSON.stringify(videoUrls),
            introVideoUrl: videoUrls[0],
            updatedAt: new Date(),
          })
          .where(eq(siteMedia.id, existing.id))
          .returning();

        return res.json({
          videos: videoUrls,
          message: `${videoUrls.length} video(s) uploaded successfully`,
        });
      }

      await db.insert(siteMedia).values({
        id: createId(),
        introVideoUrls: JSON.stringify(videoUrls),
        introVideoUrl: videoUrls[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(201).json({
        videos: videoUrls,
        message: `${videoUrls.length} video(s) uploaded successfully`,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Delete a specific video by index (with file cleanup)
router.delete(
  "/intro-videos/:index",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const index = parseInt(req.params.index);

      const [existing] = await db
        .select()
        .from(siteMedia)
        .orderBy(desc(siteMedia.updatedAt))
        .limit(1);

      if (!existing || !existing.introVideoUrls) {
        return res.status(404).json({ error: "No videos found" });
      }

      const videoUrls: string[] = JSON.parse(existing.introVideoUrls);

      if (index < 0 || index >= videoUrls.length) {
        return res.status(400).json({ error: "Invalid video index" });
      }

      const videoToDelete = videoUrls[index];

      // Delete from cloud storage
      try {
        const url = new URL(videoToDelete);
        const key = url.pathname
          .replace("/uploads/", "")
          .replace("/videos/", "videos/");
        const storageProvider = getStorageProvider();
        await storageProvider.delete(key);
      } catch (e) {
        // If URL parsing fails, try to delete from local disk
        const filename = path.basename(videoToDelete);
        const localPath = path.join(videosDir, filename);
        await deleteFileFromDisk(localPath);
      }

      // Remove from array
      videoUrls.splice(index, 1);

      const [updated] = await db
        .update(siteMedia)
        .set({
          introVideoUrls:
            videoUrls.length > 0 ? JSON.stringify(videoUrls) : null,
          introVideoUrl: videoUrls[0] || null,
          updatedAt: new Date(),
        })
        .where(eq(siteMedia.id, existing.id))
        .returning();

      return res.json({
        videos: videoUrls,
        message: "Video deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Cleanup orphaned files (admin only)
router.post(
  "/cleanup",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { olderThanDays = 7 } = req.body;
      const result = await cleanupOrphanedFiles(olderThanDays);

      res.json({
        message: `Cleaned up ${result.deleted.length} orphaned files`,
        deleted: result.deleted,
        errors: result.errors,
      });
    } catch (error) {
      console.error("Error cleaning up orphaned files:", error);
      res.status(500).json({ error: "Failed to cleanup orphaned files" });
    }
  },
);

// Cleanup expired resumable uploads (admin only)
router.post(
  "/cleanup-expired",
  authenticate,
  isAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const cleaned = cleanupExpiredUploads();
      res.json({
        message: `Cleaned up ${cleaned} expired upload sessions`,
      });
    } catch (error) {
      console.error("Error cleaning up expired uploads:", error);
      res.status(500).json({ error: "Failed to cleanup expired uploads" });
    }
  },
);

// Get intro video poster/thumbnail
router.get(
  "/intro-video-poster",
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [latest] = await db
        .select()
        .from(siteMedia)
        .orderBy(desc(siteMedia.updatedAt))
        .limit(1);

      const poster = (latest as any)?.introVideoPoster || null;
      res.json({ poster });
    } catch (error) {
      console.error("Error fetching poster:", error);
      res.json({ poster: null });
    }
  },
);

// Upload intro video poster
router.post(
  "/intro-video-poster",
  authenticate,
  isAdmin,
  imageUpload.single("poster"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "Poster image is required" });
      }

      // Check rate limit
      const ip = req.ip || "unknown";
      const rateCheck = checkUploadRateLimit(ip, req.user?.id, file.size);
      if (!rateCheck.allowed) {
        await deleteFileFromDisk(file.path);
        return res.status(429).json({
          error: rateCheck.reason,
          retryAfter: rateCheck.retryAfter,
        });
      }

      // Scan for viruses
      const scanResult = await scanForViruses(file.path);
      if (!scanResult.isClean) {
        await deleteFileFromDisk(file.path);
        return res.status(400).json({
          error: "File failed virus scan",
          threat: scanResult.threat,
        });
      }

      // Upload to cloud storage
      const storageProvider = getStorageProvider();
      const cloudResult = await storageProvider.upload(
        file.path,
        `images/${file.filename}`,
        file.mimetype,
      );

      const posterUrl = cloudResult.url;

      // Delete local file if using cloud storage
      if (mediaConfig.cloud.provider !== "local") {
        await deleteFileFromDisk(file.path);
      }

      const [existing] = await db
        .select()
        .from(siteMedia)
        .orderBy(desc(siteMedia.updatedAt))
        .limit(1);

      if (existing) {
        await db
          .update(siteMedia)
          .set({
            introVideoPoster: posterUrl,
            updatedAt: new Date(),
          })
          .where(eq(siteMedia.id, existing.id));

        return res.json({
          poster: posterUrl,
          message: "Poster uploaded successfully",
        });
      }

      await db.insert(siteMedia).values({
        id: createId(),
        introVideoPoster: posterUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(201).json({
        poster: posterUrl,
        message: "Poster uploaded successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Legacy endpoint for backward compatibility
router.get(
  "/intro-video",
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [latest] = await db
        .select()
        .from(siteMedia)
        .orderBy(desc(siteMedia.updatedAt))
        .limit(1);

      const videoUrls = latest?.introVideoUrls
        ? JSON.parse(latest.introVideoUrls)
        : latest?.introVideoUrl
          ? [latest.introVideoUrl]
          : [];

      res.json({ videos: videoUrls, url: videoUrls[0] || null });
    } catch (error) {
      next(error);
    }
  },
);

// ===========================
// Site Settings (Images, Content, SEO)
// ===========================

// Get all site settings
router.get(
  "/settings",
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Set cache control headers to prevent caching
      res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.set("Surrogate-Control", "no-store");

      const [latest] = await db
        .select()
        .from(siteMedia)
        .orderBy(desc(siteMedia.updatedAt))
        .limit(1);

      console.log("[SITE SETTINGS] Fetching settings from database:");
      console.log("- Found record:", !!latest);
      if (latest) {
        console.log(
          "- imageSettings raw:",
          latest.imageSettings?.substring(0, 200),
        );
        console.log(
          "- contentSettings raw:",
          latest.contentSettings?.substring(0, 200),
        );
        console.log(
          "- seoSettings raw:",
          latest.seoSettings?.substring(0, 200),
        );
      }

      if (!latest) {
        console.log("[SITE SETTINGS] No record found, returning null");
        return res.json({
          imageSettings: null,
          contentSettings: null,
          seoSettings: null,
        });
      }

      // Parse JSON fields
      const imageSettings = latest.imageSettings
        ? JSON.parse(latest.imageSettings)
        : null;
      const contentSettings = latest.contentSettings
        ? JSON.parse(latest.contentSettings)
        : null;
      const seoSettings = latest.seoSettings
        ? JSON.parse(latest.seoSettings)
        : null;

      console.log("[SITE SETTINGS] Returning parsed settings:");
      console.log(
        "- imageSettings keys:",
        imageSettings ? Object.keys(imageSettings) : null,
      );
      console.log(
        "- contentSettings keys:",
        contentSettings ? Object.keys(contentSettings) : null,
      );
      console.log(
        "- seoSettings keys:",
        seoSettings ? Object.keys(seoSettings) : null,
      );

      res.json({
        imageSettings,
        contentSettings,
        seoSettings,
      });
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.json({
        imageSettings: null,
        contentSettings: null,
        seoSettings: null,
      });
    }
  },
);

// Update site settings (admin only)
router.put(
  "/settings",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { imageSettings, contentSettings, seoSettings } = req.body;

      console.log("[SITE SETTINGS] Received save request:");
      console.log("- imageSettings:", JSON.stringify(imageSettings, null, 2));
      console.log(
        "- contentSettings:",
        JSON.stringify(contentSettings, null, 2),
      );
      console.log("- seoSettings:", JSON.stringify(seoSettings, null, 2));

      // Check if there's an existing record
      const [existing] = await db
        .select()
        .from(siteMedia)
        .orderBy(desc(siteMedia.updatedAt))
        .limit(1);

      const settingsData = {
        imageSettings: imageSettings ? JSON.stringify(imageSettings) : null,
        contentSettings: contentSettings
          ? JSON.stringify(contentSettings)
          : null,
        seoSettings: seoSettings ? JSON.stringify(seoSettings) : null,
        updatedAt: new Date(),
      };

      if (existing) {
        console.log(
          "[SITE SETTINGS] Updating existing record with ID:",
          existing.id,
        );
        // Update existing record
        await db
          .update(siteMedia)
          .set(settingsData)
          .where(eq(siteMedia.id, existing.id));
      } else {
        console.log("[SITE SETTINGS] Creating new record");
        // Create new record
        await db.insert(siteMedia).values({
          id: createId(),
          ...settingsData,
          createdAt: new Date(),
        });
      }

      console.log("[SITE SETTINGS] Save successful");
      res.json({
        success: true,
        message: "Settings saved successfully",
        imageSettings: imageSettings || null,
        contentSettings: contentSettings || null,
        seoSettings: seoSettings || null,
      });
    } catch (error) {
      console.error("Error saving site settings:", error);
      next(error);
    }
  },
);

export default router;
