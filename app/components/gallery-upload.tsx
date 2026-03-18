"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GalleryItem } from "@/lib/supabase/types";
import {
  classifyFile,
  validateFile,
  compressImage,
  getImageDimensions,
  getVideoDimensions,
  generateVideoThumbnail,
  generateFileName,
  getExtension,
  isHeic,
  isMov,
  convertHeicToJpeg,
  transcodeMovToMp4,
} from "@/lib/media-utils";
import { UploadConfirmationModal } from "./upload-confirmation-modal";

const DRAFT_NAME_KEY = "wedding-party-wish-draft";
const MAX_FILES_PER_BATCH = 10;

type UploadProgress = {
  fileName: string;
  status: "compressing" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

export function GalleryUpload({
  onUploadComplete,
}: {
  onUploadComplete: (item: GalleryItem) => void;
}) {
  const [guestName, setGuestName] = useState("");
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [overLimitCount, setOverLimitCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-populate guest name from wish draft
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_NAME_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setGuestName(parsed.name);
      }
    } catch {
      // ignore
    }
  }, []);

  const updateUpload = (
    index: number,
    update: Partial<UploadProgress>,
  ) => {
    setUploads((prev) =>
      prev.map((u, i) => (i === index ? { ...u, ...update } : u)),
    );
  };

  const processFile = async (file: File, index: number) => {
    const mediaType = classifyFile(file);
    if (!mediaType) {
      updateUpload(index, {
        status: "error",
        error: "Unsupported file type.",
      });
      return;
    }

    const validationError = validateFile(file, mediaType);
    if (validationError) {
      updateUpload(index, { status: "error", error: validationError });
      return;
    }

    const supabase = createClient();
    let fileToUpload: File | Blob = file;
    let thumbPath: string | null = null;
    let width = 0;
    let height = 0;

    // Convert HEIC if needed, then compress
    if (mediaType === "photo") {
      updateUpload(index, { status: "compressing" });

      if (isHeic(file)) {
        try {
          fileToUpload = await convertHeicToJpeg(file);
        } catch {
          updateUpload(index, {
            status: "error",
            error:
              "Couldn't process this HEIC image. Try converting to JPEG first.",
          });
          return;
        }
      }

      fileToUpload = await compressImage(fileToUpload as File);

      const dims = await getImageDimensions(fileToUpload as File);
      width = dims.width;
      height = dims.height;
    }

    // Video: normalize MOV to MP4 for reliable playback across browsers.
    if (mediaType === "video") {
      if (isMov(file)) {
        updateUpload(index, { status: "compressing", progress: 0 });
        try {
          fileToUpload = await transcodeMovToMp4(file, (progress) => {
            updateUpload(index, { status: "compressing", progress });
          });
        } catch {
          updateUpload(index, {
            status: "error",
            error:
              "Couldn't convert this video. Try recording in MP4 format.",
          });
          return;
        }
      }

      const dims = await getVideoDimensions(fileToUpload as File);
      width = dims.width;
      height = dims.height;

      updateUpload(index, { status: "compressing", progress: 0 });
      const thumbnail = await generateVideoThumbnail(fileToUpload as File);
      if (thumbnail) {
        const thumbName = generateFileName("jpg");
        const thumbFilePath = `thumbs/${thumbName}`;
        const { error: thumbErr } = await supabase.storage
          .from("gallery")
          .upload(thumbFilePath, thumbnail, {
            contentType: "image/jpeg",
            cacheControl: "31536000",
          });
        if (!thumbErr) {
          thumbPath = thumbFilePath;
        }
      }
    }

    // Upload main file
    updateUpload(index, { status: "uploading", progress: 0 });

    const wasConverted = fileToUpload !== file;
    const uploadFile = fileToUpload as File;
    const ext = wasConverted ? getExtension(uploadFile) : getExtension(file);
    const contentType = wasConverted ? uploadFile.type : file.type;
    const fileName = generateFileName(ext);
    const folder = mediaType === "photo" ? "photos" : "videos";
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(filePath, fileToUpload, {
        contentType,
        cacheControl: "31536000",
      });

    if (uploadError) {
      console.error("Gallery upload error:", uploadError);
      updateUpload(index, {
        status: "error",
        error: `Upload failed: ${uploadError.message}`,
      });
      return;
    }

    // Insert gallery_items row
    const { data, error: insertError } = await supabase
      .from("gallery_items")
      .insert({
        file_path: filePath,
        media_type: mediaType,
        thumb_path: thumbPath,
        width: width || null,
        height: height || null,
        guest_name: guestName.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Gallery insert error:", insertError);
      updateUpload(index, {
        status: "error",
        error: `Failed to save: ${insertError.message}`,
      });
      return;
    }

    updateUpload(index, { status: "done", progress: 100 });

    if (data) {
      onUploadComplete(data as unknown as GalleryItem);
    }
  };

  const handleFileSelection = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const allFiles = Array.from(files);
    const errors: string[] = [];
    const validFiles: File[] = [];

    // Validate before showing confirmation
    for (const file of allFiles.slice(0, MAX_FILES_PER_BATCH)) {
      const mediaType = classifyFile(file);
      if (!mediaType) {
        errors.push(`${file.name}: Unsupported file type`);
        continue;
      }
      const validationError = validateFile(file, mediaType);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        continue;
      }
      validFiles.push(file);
    }

    setValidationErrors(errors);
    setOverLimitCount(Math.max(0, allFiles.length - MAX_FILES_PER_BATCH));

    if (validFiles.length > 0) {
      setPendingFiles(validFiles);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmUpload = async (confirmedFiles: File[]) => {
    setPendingFiles(null);
    setValidationErrors([]);
    setOverLimitCount(0);

    if (confirmedFiles.length === 0) return;

    const newUploads: UploadProgress[] = confirmedFiles.map((f) => ({
      fileName: f.name,
      status: "compressing" as const,
      progress: 0,
    }));

    setUploads(newUploads);
    setIsUploading(true);

    for (let i = 0; i < confirmedFiles.length; i++) {
      await processFile(confirmedFiles[i], i);
    }

    setIsUploading(false);

    // Clear completed uploads after a delay
    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => u.status === "error"));
    }, 3000);
  };

  const handleCancelUpload = () => {
    setPendingFiles(null);
    setValidationErrors([]);
    setOverLimitCount(0);
  };

  return (
    <div className="soft-card-strong rounded-[1.5rem] p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-ink-soft">
        Μοιράσου μια φωτογραφία ή βίντεο
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <input
          type="text"
          placeholder="Το όνομά σου (προαιρετικά)"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          maxLength={100}
          className="rounded-xl border border-border-soft bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-periwinkle/40 sm:flex-1"
          aria-label="Your name"
        />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="hero-accent-button rounded-full px-6 py-2.5 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {isUploading ? "Ανεβαίνει..." : "Επιλογή αρχείων"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => handleFileSelection(e.target.files)}
          className="hidden"
          aria-label="Επιλογή φωτογραφιών ή βίντεο"
        />
      </div>

      {validationErrors.length > 0 && (
        <div className="mt-3 space-y-1">
          {validationErrors.map((error, i) => (
            <p key={i} className="text-xs text-red-500" role="alert">
              {error}
            </p>
          ))}
        </div>
      )}

      {pendingFiles && (
        <UploadConfirmationModal
          files={pendingFiles}
          overLimitCount={overLimitCount}
          onConfirm={handleConfirmUpload}
          onCancel={handleCancelUpload}
        />
      )}

      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map((upload, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border-soft px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate text-foreground/80">
                {upload.fileName}
              </span>
              {upload.status === "compressing" && (
                <span className="shrink-0 text-xs text-ink-soft">
                  {upload.progress > 0
                    ? `Μετατροπή... ${upload.progress}%`
                    : "Επεξεργασία..."}
                </span>
              )}
              {upload.status === "uploading" && (
                <span className="shrink-0 text-xs text-periwinkle">
                  Ανεβαίνει...
                </span>
              )}
              {upload.status === "done" && (
                <span className="shrink-0 text-xs text-pistachio">
                  Έτοιμο
                </span>
              )}
              {upload.status === "error" && (
                <span
                  className="shrink-0 text-xs text-red-500"
                  role="alert"
                >
                  {upload.error}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
