"use client";

import type { Wish } from "@/lib/supabase/types";
import { adminFetch } from "@/lib/admin";
import { WISH_FONT_COUNT } from "@/app/fonts";

const ACCENT_COLORS = [
  "bg-mint/30",
  "bg-periwinkle/30",
  "bg-blush/30",
  "bg-apricot/30",
  "bg-pistachio/30",
];

function relativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  return `${days}d ago`;
}

export function WishCard({
  wish,
  index,
  isNew,
  isAdmin,
  onToggleHidden,
}: {
  wish: Wish;
  index: number;
  isNew?: boolean;
  isAdmin?: boolean;
  onToggleHidden?: (id: number, hidden: boolean) => void;
}) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const fontClass = `wish-font-${index % WISH_FONT_COUNT}`;
  const isHidden = wish.hidden;

  const handleToggle = async () => {
    const newHidden = !isHidden;
    const res = await adminFetch(`/api/admin/wishes/${wish.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: newHidden }),
    });
    if (res.ok && onToggleHidden) onToggleHidden(wish.id, newHidden);
  };

  return (
    <article
      className={`soft-card relative rounded-[1.5rem] p-5 ${fontClass} ${isNew ? "wish-card-enter" : ""} ${isHidden ? "opacity-40" : ""}`}
    >
      <div className={`${accent} -mx-5 -mt-5 mb-4 rounded-t-[1.5rem] px-5 py-3`}>
        <p className="text-sm font-semibold text-foreground">{wish.name}</p>
      </div>
      <p className="text-lg leading-relaxed text-foreground/90">
        {wish.message}
      </p>
      <p className="mt-3 font-sans text-xs text-ink-soft">{relativeTime(wish.created_at)}</p>
      {isAdmin && (
        <button
          type="button"
          onClick={handleToggle}
          className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-100 ${
            isHidden
              ? "bg-pistachio/20 text-foreground opacity-80"
              : "bg-red-500/10 text-red-500 opacity-60"
          }`}
          title={isHidden ? "Show wish" : "Hide wish"}
        >
          {isHidden ? "show" : "hide"}
        </button>
      )}
    </article>
  );
}
