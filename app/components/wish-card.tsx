"use client";

import type { Wish } from "@/lib/supabase/types";
import { adminFetch } from "@/lib/admin";
import { WISH_FONT_COUNT } from "@/app/fonts";

const ROTATIONS = [-2, 1.5, -1, 2.5, -0.5, 1.8, -1.5];

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
  const fontClass = `wish-font-${index % WISH_FONT_COUNT}`;
  const rotation = ROTATIONS[index % ROTATIONS.length];
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
      className={`relative px-4 py-3 ${fontClass} ${isNew ? "wish-card-enter" : ""} ${isHidden ? "opacity-40" : ""}`}
      style={{ rotate: `${rotation}deg` }}
    >
      <p className="text-base leading-relaxed text-foreground/90">
        {wish.message}
      </p>
      <p className="mt-2 text-right text-sm text-ink-soft">— {wish.name}</p>
      {isAdmin && (
        <button
          type="button"
          onClick={handleToggle}
          className={`absolute top-1 right-1 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-100 ${
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
