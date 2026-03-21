"use client";

import type { Wish } from "@/lib/supabase/types";
import { adminFetch } from "@/lib/admin";
import { WISH_FONT_COUNT } from "@/app/fonts";

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
      className={`relative pl-[12px] pt-[8px] ${fontClass} ${isNew ? "wish-card-enter" : ""} ${isHidden ? "opacity-40" : ""}`}
    >
      <p className="text-[20px] leading-normal text-jneutral">
        {wish.message}
      </p>
      <div className="flex items-center justify-end pr-[16px]">
        <p className="font-playpen text-[15px] font-[300] text-jneutral opacity-90">
          {wish.name}
        </p>
      </div>
      {isAdmin && (
        <button
          type="button"
          onClick={handleToggle}
          className={`absolute top-0 right-0 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-100 ${
            isHidden
              ? "bg-jgreen/20 text-jneutral opacity-80"
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
