import { Router, Response, NextFunction } from "express";
import { db } from "@/db";
import { siteMedia } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "@/middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createId } from "@paralleldrive/cuid2";

const router = Router();

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const videosDir = path.resolve(process.cwd(), "uploads", "videos");
ensureDir(videosDir);

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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/webm", "video/ogg"];
    const isAllowed = allowedTypes.includes(file.mimetype);
    if (!isAllowed) {
      return cb(new Error("Only MP4, WebM, and OGG videos are allowed"));
    }
    cb(null, true);
  },
});

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

      res.json({ videos: videoUrls });
    } catch (error) {
      next(error);
    }
  },
);

// Upload multiple videos (1-5)
router.post(
  "/intro-videos",
  authenticate,
  isAdmin,
  videoUpload.array("videos", 5),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { filename: string; originalname: string; mimetype: string }[] | undefined;

      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one video file is required" });
      }

      if (files.length > 5) {
        return res.status(400).json({ error: "Maximum 5 videos allowed" });
      }

      const videoUrls = files.map((file) => {
        return `${req.protocol}://${req.get("host")}/uploads/videos/${file.filename}`;
      });

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
            introVideoUrl: videoUrls[0], // Keep first video for backward compatibility
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

// Delete a specific video by index
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

      // Remove the video at the specified index
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

      // Handle case where introVideoPoster column might not exist
      const poster = (latest as any)?.introVideoPoster || null;
      res.json({ poster });
    } catch (error) {
      // If column doesn't exist, return null instead of error
      console.error("Error fetching poster:", error);
      res.json({ poster: null });
    }
  },
);

// Image storage for posters
const imagesDir = path.resolve(process.cwd(), "uploads", "images");
ensureDir(imagesDir);

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

      const posterUrl = `${req.protocol}://${req.get("host")}/uploads/images/${file.filename}`;

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

export default router;
