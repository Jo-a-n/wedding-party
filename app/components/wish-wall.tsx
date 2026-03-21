"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Wish } from "@/lib/supabase/types";
import { WishCard } from "./wish-card";
import { WishInput } from "./wish-input";

export function WishWall({
  initialWishes,
  isAdmin,
  deadline,
}: {
  initialWishes: Wish[];
  isAdmin?: boolean;
  deadline: string;
}) {
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(() => Date.now() < new Date(deadline).getTime());

  // Re-check deadline every minute
  useEffect(() => {
    if (!open) return;
    const deadlineMs = new Date(deadline).getTime();
    const interval = setInterval(() => {
      if (Date.now() >= deadlineMs) setOpen(false);
    }, 60_000);
    return () => clearInterval(interval);
  }, [open, deadline]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("wishes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wishes" },
        (payload) => {
          const raw = payload.new;
          if (!raw || typeof raw.id !== "number" || typeof raw.name !== "string") return;
          const newWish = raw as unknown as Wish;
          setWishes((prev) => {
            // Deduplicate against optimistic adds
            if (prev.some((w) => w.id === newWish.id)) return prev;
            return [newWish, ...prev];
          });
          setNewIds((prev) => new Set(prev).add(newWish.id));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wishes" },
        (payload) => {
          const updated = payload.new as unknown as Wish;
          if (typeof updated.id !== "number") return;
          if (isAdmin) {
            // Admin sees everything — just update the hidden flag in place
            setWishes((prev) =>
              prev.map((w) => (w.id === updated.id ? { ...w, hidden: updated.hidden } : w)),
            );
          } else if (updated.hidden) {
            // Guest: remove hidden wishes
            setWishes((prev) => prev.filter((w) => w.id !== updated.id));
          } else {
            // Guest: unhidden wish appears — add it if not already present
            setWishes((prev) => {
              if (prev.some((w) => w.id === updated.id)) return prev;
              return [updated, ...prev];
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "wishes" },
        (payload) => {
          const old = payload.old;
          if (old && typeof old.id === "number") {
            setWishes((prev) => prev.filter((w) => w.id !== old.id));
          }
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

  const handleToggleHidden = useCallback((id: number, hidden: boolean) => {
    setWishes((prev) =>
      prev.map((w) => (w.id === id ? { ...w, hidden } : w)),
    );
  }, []);

  return (
    <section id="wishes" className="py-8">
      <div className="mb-6 text-center">
        <p className="font-playpen text-[15px] font-[200] text-jneutral opacity-90">
          Ευχές καλεσμένων
        </p>
        <h2 className="font-arima mt-2 text-[30px] font-[400] text-jneutral">
          Ευχές για το ζευγάρι
        </h2>
      </div>

      {open || isAdmin ? (
        <div className="mb-8">
          <WishInput onOptimisticAdd={handleOptimisticAdd} />
        </div>
      ) : (
        <div className="soft-chip mb-8 inline-flex rounded-full px-4 py-2 text-sm text-ink-soft">
          Οι ευχές έκλεισαν. Ευχαριστούμε για τα υπέροχα μηνύματά σας!
        </div>
      )}

      {wishes.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">💌</p>
          <p className="mt-4 text-lg text-ink-soft">
            Γίνε ο πρώτος που θα αφήσει μια ευχή για το ζευγάρι!
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-[28px] sm:grid-cols-2"
          aria-live="polite"
          aria-label="Guest wishes"
        >
          {wishes.map((wish) => (
            <WishCard
              key={wish.id}
              wish={wish}
              index={wish.id}
              isNew={newIds.has(wish.id)}
              isAdmin={isAdmin}
              onToggleHidden={handleToggleHidden}
            />
          ))}
        </div>
      )}
    </section>
  );
}
