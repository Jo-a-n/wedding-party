"use client";

import { useState } from "react";
import Masonry from "react-masonry-css";
import type { GalleryItem } from "@/lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function storageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/gallery/${path}`;
}

const MASONRY_BREAKPOINTS = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

function GalleryTile({
  item,
  isNew,
  onClick,
}: {
  item: GalleryItem;
  isNew: boolean;
  onClick: () => void;
}) {
  const isVideo = item.media_type === "video";
  const src = isVideo
    ? item.thumb_path
      ? storageUrl(item.thumb_path)
      : null
    : storageUrl(item.file_path);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative block w-full overflow-hidden rounded-2xl border border-border-soft bg-surface-card focus:outline-none focus:ring-2 focus:ring-periwinkle/40 ${isNew ? "wish-card-enter" : ""}`}
      style={{ background: "var(--surface-card)" }}
    >
      {src ? (
        <img
          src={src}
          alt={item.guest_name ? `Photo by ${item.guest_name}` : "Gallery photo"}
          loading="lazy"
          decoding="async"
          className="block w-full object-cover"
        />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-ink-soft/10">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-ink-soft/40"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      )}

      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/40 p-3 transition-transform group-hover:scale-110">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="white"
            >
              <polygon points="8 5 19 12 8 19 8 5" />
            </svg>
          </div>
        </div>
      )}

      {item.guest_name && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 pb-2 pt-6">
          <p className="text-xs font-medium text-white/90">
            {item.guest_name}
          </p>
        </div>
      )}
    </button>
  );
}

const PAGE_SIZE = 50;

export function GalleryGrid({
  items,
  newIds,
  totalCount,
  onLoadMore,
  onItemClick,
}: {
  items: GalleryItem[];
  newIds: Set<number>;
  totalCount: number;
  onLoadMore: () => void;
  onItemClick: (index: number) => void;
}) {
  const hasMore = items.length < totalCount;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-4xl">📸</p>
        <p className="mt-4 text-lg text-ink-soft">
          Be the first to share a photo!
        </p>
      </div>
    );
  }

  return (
    <div aria-label="Photo gallery" aria-live="polite">
      <Masonry
        breakpointCols={MASONRY_BREAKPOINTS}
        className="gallery-masonry"
        columnClassName="gallery-masonry-column"
      >
        {items.map((item, index) => (
          <GalleryTile
            key={item.id}
            item={item}
            isNew={newIds.has(item.id)}
            onClick={() => onItemClick(index)}
          />
        ))}
      </Masonry>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            className="soft-chip-strong rounded-full px-6 py-2.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-periwinkle/20"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

export { storageUrl, PAGE_SIZE };
