"use client";

import { useEffect, useState, useCallback } from "react";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";
import { createClient } from "@/lib/supabase/client";
import type { GalleryItem } from "@/lib/supabase/types";
import { GalleryUpload } from "./gallery-upload";
import { GalleryGrid, storageUrl, PAGE_SIZE } from "./gallery-grid";

const GALLERY_DEADLINE = new Date("2026-03-22T11:00:00+03:00");

function isGalleryOpen(): boolean {
  return Date.now() < GALLERY_DEADLINE.getTime();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function fullStorageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/gallery/${path}`;
}

export function GallerySection({
  initialItems,
  initialCount,
}: {
  initialItems: GalleryItem[];
  initialCount: number;
}) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(isGalleryOpen);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Re-check deadline every minute
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      if (!isGalleryOpen()) setOpen(false);
    }, 60_000);
    return () => clearInterval(interval);
  }, [open]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("gallery-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gallery_items" },
        (payload) => {
          const raw = payload.new;
          if (
            !raw ||
            typeof raw.id !== "number" ||
            typeof raw.file_path !== "string"
          )
            return;
          const newItem = raw as unknown as GalleryItem;
          setItems((prev) => {
            if (prev.some((item) => item.id === newItem.id)) return prev;
            setTotalCount((c) => c + 1);
            return [newItem, ...prev];
          });
          setNewIds((prev) => new Set(prev).add(newItem.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUploadComplete = useCallback((item: GalleryItem) => {
    setItems((prev) => {
      if (prev.some((existing) => existing.id === item.id)) return prev;
      return [item, ...prev];
    });
    setTotalCount((prev) => prev + 1);
    setNewIds((prev) => new Set(prev).add(item.id));
  }, []);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .order("created_at", { ascending: false })
        .range(items.length, items.length + PAGE_SIZE - 1);

      if (!error && data) {
        setItems((prev) => [
          ...prev,
          ...(data as unknown as GalleryItem[]).filter(
            (d) => !prev.some((p) => p.id === d.id),
          ),
        ]);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [items.length]);

  // Build lightbox slides
  const slides = items.map((item) => {
    if (item.media_type === "video") {
      return {
        type: "video" as const,
        sources: [
          {
            src: fullStorageUrl(item.file_path),
            type: item.file_path.endsWith(".webm")
              ? "video/webm"
              : "video/mp4",
          },
        ],
        poster: item.thumb_path
          ? fullStorageUrl(item.thumb_path)
          : undefined,
        width: item.width ?? 1920,
        height: item.height ?? 1080,
      };
    }
    return {
      src: fullStorageUrl(item.file_path),
      width: item.width ?? 1920,
      height: item.height ?? 1080,
    };
  });

  return (
    <section id="gallery" className="py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-soft">
          Photo album
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
          Shared moments
        </h2>
      </div>

      {open ? (
        <div className="mb-8">
          <GalleryUpload onUploadComplete={handleUploadComplete} />
        </div>
      ) : (
        <div className="soft-chip mb-8 inline-flex rounded-full px-4 py-2 text-sm text-ink-soft">
          Uploads are now closed. Thank you for sharing your moments!
        </div>
      )}

      <GalleryGrid
        items={items}
        newIds={newIds}
        totalCount={totalCount}
        loading={loadingMore}
        onLoadMore={handleLoadMore}
        onItemClick={(index) => setLightboxIndex(index)}
      />

      <Lightbox
        plugins={[Video]}
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
        }}
      />
    </section>
  );
}
