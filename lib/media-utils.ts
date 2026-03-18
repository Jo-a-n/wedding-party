import imageCompression from "browser-image-compression";

const PHOTO_MAX_SIZE_MB = 20;
const VIDEO_MAX_SIZE_MB = 100;
const COMPRESSION_MAX_WIDTH = 1920;
const COMPRESSION_TARGET_MB = 1;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "heic",
  "heif",
  "avif",
  "tiff",
  "tif",
]);

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "mov",
  "webm",
  "avi",
  "mkv",
  "m4v",
  "3gp",
]);

export function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type.includes("heic") || type.includes("heif")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "heic" || ext === "heif";
}

export function isMov(file: File): boolean {
  if (file.type === "video/quicktime") return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "mov";
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  const newName = file.name.replace(/\.hei[cf]$/i, ".jpg");

  // Try native browser decoding first (Chrome 126+, Safari)
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const jpegBlob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: 0.85,
      });
      return new File([jpegBlob], newName, { type: "image/jpeg" });
    }
    bitmap.close();
  } catch {
    // Native decoding not supported, fall through to heic-decode
  }

  // Fallback to heic-decode for older browsers
  const decode = (await import("heic-decode")).default;
  const uint8 = new Uint8Array(await file.arrayBuffer());
  const { width, height, data } = await decode({ buffer: uint8 });

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  const pixels =
    data instanceof Uint8ClampedArray
      ? data
      : new Uint8ClampedArray(data.buffer ?? data);
  const imageData = new ImageData(pixels, width, height);
  ctx.putImageData(imageData, 0, 0);
  const jpegBlob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: 0.85,
  });
  return new File([jpegBlob], newName, { type: "image/jpeg" });
}

export function canBrowserPlayVideo(file: File): Promise<boolean> {
  return withTimeout(
    new Promise<boolean>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(true);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(false);
      };

      video.src = URL.createObjectURL(file);
    }),
    8000,
    false,
  );
}

export async function transcodeMovToMp4(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<File> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  try {
    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) =>
        onProgress(Math.round(progress * 100)),
      );
    }

    await ffmpeg.load();
    await ffmpeg.writeFile("input.mov", await fetchFile(file));
    await ffmpeg.exec([
      "-i",
      "input.mov",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      "output.mp4",
    ]);

    const data = await ffmpeg.readFile("output.mp4");
    const mp4Blob = new Blob([new Uint8Array(data as Uint8Array)], {
      type: "video/mp4",
    });
    return new File([mp4Blob], file.name.replace(/\.mov$/i, ".mp4"), {
      type: "video/mp4",
    });
  } finally {
    ffmpeg.terminate();
  }
}

export type MediaFile = {
  file: File;
  type: "photo" | "video";
};

export function classifyFile(file: File): "photo" | "video" | null {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("video/")) return "video";

  // Extension-based fallback for empty/missing MIME types
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && IMAGE_EXTENSIONS.has(ext)) return "photo";
  if (ext && VIDEO_EXTENSIONS.has(ext)) return "video";

  return null;
}

export function validateFile(
  file: File,
  type: "photo" | "video",
): string | null {
  const maxMB = type === "photo" ? PHOTO_MAX_SIZE_MB : VIDEO_MAX_SIZE_MB;
  const maxBytes = maxMB * 1024 * 1024;

  if (file.size > maxBytes) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is ${maxMB}MB.`;
  }

  return null;
}

export async function compressImage(file: File): Promise<File> {
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: COMPRESSION_TARGET_MB,
      maxWidthOrHeight: COMPRESSION_MAX_WIDTH,
      useWebWorker: true,
      fileType: "image/jpeg",
    });
    return compressed;
  } catch {
    // If compression fails (e.g. HEIC on Chrome), fall back to original file
    console.warn("Image compression failed, uploading original file");
    return file;
  }
}

export async function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    return { width, height };
  } catch {
    return { width: 0, height: 0 };
  }
}

export async function getVideoDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return withTimeout(
    new Promise<{ width: number; height: number }>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth, height: video.videoHeight });
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    }),
    8000,
    { width: 0, height: 0 },
  );
}

export async function generateVideoThumbnail(
  file: File,
): Promise<Blob | null> {
  return withTimeout(
    new Promise<Blob | null>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(video, 0, 0);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(video.src);
              resolve(blob);
            },
            "image/jpeg",
            0.7,
          );
        } catch {
          URL.revokeObjectURL(video.src);
          resolve(null);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(null);
      };

      video.src = URL.createObjectURL(file);
    }),
    10000,
    null,
  );
}

export function generateFileName(extension: string): string {
  return `${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

export function getExtension(file: File): string {
  const name = file.name;
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex === -1) return file.type.startsWith("video/") ? "mp4" : "jpg";
  return name.slice(dotIndex + 1).toLowerCase();
}
