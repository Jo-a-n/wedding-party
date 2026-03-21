"use client";

import { useEffect, useState, useCallback } from "react";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";
import { createClient } from "@/lib/supabase/client";
import type { GalleryItem } from "@/lib/supabase/types";
import { GalleryUpload } from "./gallery-upload";
import { GalleryGrid, storageUrl, PAGE_SIZE } from "./gallery-grid";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function fullStorageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/gallery/${path}`;
}

function getVideoMimeType(path: string): string {
  const normalized = path.split("?")[0]?.toLowerCase() ?? "";

  if (normalized.endsWith(".mp4") || normalized.endsWith(".m4v")) {
    return "video/mp4";
  }

  if (normalized.endsWith(".webm")) {
    return "video/webm";
  }

  if (normalized.endsWith(".mov")) {
    return "video/quicktime";
  }

  if (normalized.endsWith(".ogv")) {
    return "video/ogg";
  }

  return "video/mp4";
}

export function GallerySection({
  initialItems,
  initialCount,
  isAdmin,
  deadline,
  largeUploadAlbumUrl,
}: {
  initialItems: GalleryItem[];
  initialCount: number;
  isAdmin?: boolean;
  deadline: string;
  largeUploadAlbumUrl?: string;
}) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(() => Date.now() < new Date(deadline).getTime());
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [loadingMore, setLoadingMore] = useState(false);

  const incrementViewCount = useCallback(
    async (index: number) => {
      const item = items[index];
      if (item) {
        setItems((prev) =>
          prev.map((it, i) =>
            i === index ? { ...it, view_count: it.view_count + 1 } : it,
          ),
        );
        const supabase = createClient();
        const { error } = await supabase.rpc("increment_view_count", { item_id: item.id });
        if (error) {
          console.error("Failed to increment view count:", error);
        }
      }
    },
    [items],
  );

  const handleItemClick = useCallback(
    (index: number) => {
      setLightboxIndex(index);
      void incrementViewCount(index);
    },
    [incrementViewCount],
  );

  // Re-check deadline every minute
  useEffect(() => {
    if (!open) return;
    const deadlineMs = new Date(deadline).getTime();
    const interval = setInterval(() => {
      if (Date.now() >= deadlineMs) setOpen(false);
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
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "gallery_items" },
        (payload) => {
          const old = payload.old;
          if (old && typeof old.id === "number") {
            setItems((prev) => prev.filter((item) => item.id !== old.id));
            setTotalCount((c) => Math.max(0, c - 1));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "gallery_items" },
        (payload) => {
          const updated = payload.new as unknown as GalleryItem;
          if (typeof updated.id !== "number") return;
          if (isAdmin) {
            // Admin sees everything — update in place
            setItems((prev) =>
              prev.map((item) =>
                item.id === updated.id
                  ? { ...item, view_count: updated.view_count, hidden: updated.hidden }
                  : item,
              ),
            );
          } else if (updated.hidden) {
            // Guest: remove hidden items
            setItems((prev) => prev.filter((item) => item.id !== updated.id));
            setTotalCount((c) => Math.max(0, c - 1));
          } else {
            // Guest: view_count update or unhidden item
            setItems((prev) => {
              const exists = prev.some((item) => item.id === updated.id);
              if (exists) {
                return prev.map((item) =>
                  item.id === updated.id
                    ? { ...item, view_count: updated.view_count }
                    : item,
                );
              }
              // Unhidden item — add it back
              setTotalCount((c) => c + 1);
              return [updated, ...prev];
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggleHidden = useCallback((id: number, hidden: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, hidden } : item)),
    );
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
            type: getVideoMimeType(item.file_path),
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
      <div className="mb-6 text-center">
        <p className="font-playpen text-[15px] font-[200] text-jneutral opacity-90">
          Άλμπουμ φωτογραφιών
        </p>
        <h2 className="font-arima mt-2 text-[30px] font-normal text-jneutral">
          Κοινές στιγμές
        </h2>
      </div>

      {open || isAdmin ? (
        <div className="mb-8">
          <GalleryUpload onUploadComplete={handleUploadComplete} largeUploadAlbumUrl={largeUploadAlbumUrl} />
        </div>
      ) : (
        <div className="soft-chip mb-8 inline-flex rounded-full px-4 py-2 text-sm text-ink-soft">
          Τα ανεβάσματα έκλεισαν. Ευχαριστούμε που μοιραστήκατε τις στιγμές σας!
        </div>
      )}

      <GalleryGrid
        items={items}
        newIds={newIds}
        totalCount={totalCount}
        loading={loadingMore}
        onLoadMore={handleLoadMore}
        onItemClick={handleItemClick}
        isAdmin={isAdmin}
        onToggleHidden={handleToggleHidden}
      />

      <Lightbox
        plugins={[Video]}
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        on={{
          view: ({ index }) => {
            if (index !== lightboxIndex) {
              void incrementViewCount(index);
              setLightboxIndex(index);
            }
          },
        }}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
        }}
      />
    </section>
  );
}
