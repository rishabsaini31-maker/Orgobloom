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
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isMp4 = file.mimetype === "video/mp4";
    if (!isMp4) {
      return cb(new Error("Only MP4 videos are allowed"));
    }
    cb(null, true);
  },
});

router.get(
  "/intro-video",
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [latest] = await db
        .select()
        .from(siteMedia)
        .orderBy(desc(siteMedia.updatedAt))
        .limit(1);

      res.json({ url: latest?.introVideoUrl || null });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/intro-video",
  authenticate,
  isAdmin,
  videoUpload.single("video"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Intro video file is required" });
      }

      const publicUrl = `${req.protocol}://${req.get("host")}/uploads/videos/${file.filename}`;

      const [existing] = await db
        .select()
        .from(siteMedia)
        .orderBy(desc(siteMedia.updatedAt))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(siteMedia)
          .set({
            introVideoUrl: publicUrl,
            updatedAt: new Date(),
          })
          .where(eq(siteMedia.id, existing.id))
          .returning();

        return res.json({ url: updated?.introVideoUrl || publicUrl });
      }

      const [created] = await db
        .insert(siteMedia)
        .values({
          id: createId(),
          introVideoUrl: publicUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return res.status(201).json({ url: created?.introVideoUrl || publicUrl });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
