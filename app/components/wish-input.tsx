"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Wish } from "@/lib/supabase/types";

const DRAFT_KEY = "wedding-party-wish-draft";

type Draft = {
  name: string;
  message: string;
};

export function WishInput({
  onOptimisticAdd,
}: {
  onOptimisticAdd: (wish: Wish) => void;
}) {
  const [draft, setDraft] = useState<Draft>({ name: "", message: "" });
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Load draft from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        setDraft(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist draft to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // storage full or disabled
    }
  }, [draft, hydrated]);

  const clearDraft = useCallback(() => {
    setDraft({ name: "", message: "" });
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = draft.name.trim();
    const message = draft.message.trim();

    if (!name || name.length > 100) {
      setError("Please enter your name (up to 100 characters).");
      return;
    }
    if (!message || message.length > 500) {
      setError("Please write a wish (up to 500 characters).");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("wishes")
        .insert({ name, message })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        onOptimisticAdd(data as Wish);
      }

      clearDraft();
      formRef.current?.querySelector("textarea")?.focus();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="soft-card-strong rounded-[1.5rem] p-5"
    >
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-ink-soft">
        Leave a wish
      </p>

      <textarea
        placeholder="Write your wish for the couple..."
        value={draft.message}
        onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
        maxLength={500}
        rows={3}
        required
        className="w-full resize-none rounded-xl border border-border-soft bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-periwinkle/40"
        aria-label="Your wish for the couple"
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <input
          type="text"
          placeholder="Your name"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          maxLength={100}
          required
          className="rounded-xl border border-border-soft bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-periwinkle/40 sm:flex-1"
          aria-label="Your name"
        />
        <button
          type="submit"
          disabled={submitting}
          className="hero-accent-button rounded-full px-6 py-2.5 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {submitting ? "Sending..." : "Send wish"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <p className="mt-2 text-right text-xs text-ink-soft/60">
        {draft.message.length}/500
      </p>
    </form>
  );
}
