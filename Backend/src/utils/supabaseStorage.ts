import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️ Supabase credentials not configured. Video uploads will not work.");
}

// Create Supabase client with service role key for admin operations
export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

const BUCKET_NAME = "orgobloom-uploads";

/**
 * Ensure the storage bucket exists
 */
export async function ensureBucketExists(): Promise<boolean> {
  if (!supabase) {
    console.error("Supabase client not initialized");
    return false;
  }

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error listing buckets:", error);
      return false;
    }

    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 100 * 1024 * 1024, // 100MB
      });
      
      if (createError) {
        console.error("Error creating bucket:", createError);
        return false;
      }
      
      console.log(`✅ Created storage bucket: ${BUCKET_NAME}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error ensuring bucket exists:", error);
    return false;
  }
}

/**
 * Upload a video file to Supabase Storage
 * @param file - The file buffer or path
 * @param filename - The filename to use in storage
 * @param folder - The folder within the bucket (e.g., "videos", "images")
 * @returns The public URL of the uploaded file
 */
export async function uploadToSupabase(
  file: Buffer | string,
  filename: string,
  folder: "videos" | "images" = "videos"
): Promise<{ url: string; error: Error | null }> {
  if (!supabase) {
    return { 
      url: "", 
      error: new Error("Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY") 
    };
  }

  try {
    // Ensure bucket exists
    await ensureBucketExists();

    let fileBuffer: Buffer;

    // If file is a path, read it
    if (typeof file === "string") {
      if (!fs.existsSync(file)) {
        return { url: "", error: new Error(`File not found: ${file}`) };
      }
      fileBuffer = fs.readFileSync(file);
    } else {
      fileBuffer = file;
    }

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".ogg": "video/ogg",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    const contentType = contentTypes[ext] || "application/octet-stream";

    // Upload to Supabase Storage
    const storagePath = `${folder}/${filename}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error("Error uploading to Supabase:", error);
      return { url: "", error };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    console.log(`✅ Uploaded to Supabase: ${urlData.publicUrl}`);
    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error("Error in uploadToSupabase:", error);
    return { url: "", error: error as Error };
  }
}

/**
 * Delete a file from Supabase Storage
 * @param url - The public URL of the file to delete
 */
export async function deleteFromSupabase(url: string): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase) {
    return { success: false, error: new Error("Supabase client not initialized") };
  }

  try {
    // Extract the path from the URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/folder/filename
    const urlParts = url.split("/");
    const bucketIndex = urlParts.findIndex((part) => part === BUCKET_NAME);
    
    if (bucketIndex === -1) {
      return { success: false, error: new Error("Invalid Supabase URL") };
    }

    const filePath = urlParts.slice(bucketIndex + 1).join("/");

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("Error deleting from Supabase:", error);
      return { success: false, error };
    }

    console.log(`✅ Deleted from Supabase: ${filePath}`);
    return { success: true, error: null };
  } catch (error) {
    console.error("Error in deleteFromSupabase:", error);
    return { success: false, error: error as Error };
  }
}

/**
 * Check if a URL is a Supabase Storage URL
 */
export function isSupabaseUrl(url: string): boolean {
  return url.includes("supabase.co/storage") || url.includes("supabase.in/storage");
}