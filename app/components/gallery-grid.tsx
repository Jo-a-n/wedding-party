"use client";

import { useState } from "react";
import Masonry from "react-masonry-css";
import type { GalleryItem } from "@/lib/supabase/types";
import { adminFetch } from "@/lib/admin";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function storageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/gallery/${path}`;
}

const MASONRY_BREAKPOINTS = {
  default: 4,
  1100: 3,
  700: 2,
  500: 2,
};

function GalleryTile({
  item,
  isNew,
  onClick,
  isAdmin,
  onToggleHidden,
}: {
  item: GalleryItem;
  isNew: boolean;
  onClick: () => void;
  isAdmin?: boolean;
  onToggleHidden?: (id: number, hidden: boolean) => void;
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
      className={`group relative block w-full overflow-hidden rounded-2xl border border-border-soft bg-surface-card focus:outline-none focus:ring-2 focus:ring-periwinkle/40 ${isNew ? "wish-card-enter" : ""} ${item.hidden ? "opacity-40" : ""}`}
    >
      {src ? (
        <img
          src={src}
          alt={item.guest_name ? `Φωτογραφία από ${item.guest_name}` : "Φωτογραφία γκαλερί"}
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

      {item.view_count > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white/90">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {item.view_count}
        </div>
      )}

      {item.guest_name && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 pb-2 pt-6">
          <p className="text-xs font-medium text-white/90">
            {item.guest_name}
          </p>
        </div>
      )}

      {isAdmin && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            const newHidden = !item.hidden;
            adminFetch(`/api/admin/gallery/${item.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hidden: newHidden }),
            }).then((res) => {
              if (res.ok && onToggleHidden) onToggleHidden(item.id, newHidden);
            });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              const newHidden = !item.hidden;
              adminFetch(`/api/admin/gallery/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hidden: newHidden }),
              }).then((res) => {
                if (res.ok && onToggleHidden) onToggleHidden(item.id, newHidden);
              });
            }
          }}
          className={`absolute bottom-2 right-2 z-10 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-100 ${
            item.hidden
              ? "bg-green-500/80 text-white opacity-80"
              : "bg-red-500/80 text-white opacity-60"
          }`}
          title={item.hidden ? "Show item" : "Hide item"}
        >
          {item.hidden ? "show" : "hide"}
        </div>
      )}
    </button>
  );
}

const PAGE_SIZE = 200;

export function GalleryGrid({
  items,
  newIds,
  totalCount,
  loading,
  onLoadMore,
  onItemClick,
  isAdmin,
  onToggleHidden,
}: {
  items: GalleryItem[];
  newIds: Set<number>;
  totalCount: number;
  loading?: boolean;
  onLoadMore: () => void;
  onItemClick: (index: number) => void;
  isAdmin?: boolean;
  onToggleHidden?: (id: number, hidden: boolean) => void;
}) {
  const hasMore = items.length < totalCount;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-4xl">📸</p>
        <p className="mt-4 text-lg text-ink-soft">
          Γίνε ο πρώτος που θα μοιραστεί μια φωτογραφία!
        </p>
      </div>
    );
  }

  return (
    <div aria-label="Γκαλερί φωτογραφιών" aria-live="polite">
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
            isAdmin={isAdmin}
            onToggleHidden={onToggleHidden}
          />
        ))}
      </Masonry>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="soft-chip-strong rounded-full px-6 py-2.5 text-sm font-semibold text-jneutral transition-colors duration-200 hover:bg-purple/20 disabled:opacity-50"
          >
            {loading ? "Φόρτωση..." : "Περισσότερα"}
          </button>
        </div>
      )}
    </div>
  );
}

export { storageUrl, PAGE_SIZE };
