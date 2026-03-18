"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Wish } from "@/lib/supabase/types";
import { WishCard } from "./wish-card";
import { WishInput } from "./wish-input";

const WISH_DEADLINE = new Date("2026-03-22T11:00:00+03:00");

function isWishingOpen(): boolean {
  return Date.now() < WISH_DEADLINE.getTime();
}

export function WishWall({ initialWishes }: { initialWishes: Wish[] }) {
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(isWishingOpen);

  // Re-check deadline every minute
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      if (!isWishingOpen()) setOpen(false);
    }, 60_000);
    return () => clearInterval(interval);
  }, [open]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("wishes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wishes" },
        (payload) => {
          const newWish = payload.new as Wish;
          setWishes((prev) => {
            // Deduplicate against optimistic adds
            if (prev.some((w) => w.id === newWish.id)) return prev;
            return [newWish, ...prev];
          });
          setNewIds((prev) => new Set(prev).add(newWish.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOptimisticAdd = useCallback((wish: Wish) => {
    setWishes((prev) => [wish, ...prev]);
    setNewIds((prev) => new Set(prev).add(wish.id));
  }, []);

  return (
    <section id="wishes" className="py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-soft">
          Guest wishes
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
          Wishes for the couple
        </h2>
      </div>

      {open ? (
        <div className="mb-8">
          <WishInput onOptimisticAdd={handleOptimisticAdd} />
        </div>
      ) : (
        <div className="soft-chip mb-8 inline-flex rounded-full px-4 py-2 text-sm text-ink-soft">
          The wish wall is now closed. Thank you for all the lovely messages!
        </div>
      )}

      {wishes.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">💌</p>
          <p className="mt-4 text-lg text-ink-soft">
            Be the first to leave a wish for the couple!
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-live="polite"
          aria-label="Guest wishes"
        >
          {wishes.map((wish) => (
            <WishCard
              key={wish.id}
              wish={wish}
              index={wish.id}
              isNew={newIds.has(wish.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
