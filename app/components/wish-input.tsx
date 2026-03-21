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
      setError("Συμπλήρωσε το όνομά σου (μέχρι 100 χαρακτήρες).");
      return;
    }
    if (!message || message.length > 500) {
      setError("Γράψε μια ευχή (μέχρι 500 χαρακτήρες).");
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
        onOptimisticAdd(data as unknown as Wish);
      }

      clearDraft();
      formRef.current?.querySelector("textarea")?.focus();
    } catch {
      setError("Κάτι πήγε στραβά. Δοκίμασε ξανά.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-[14px] overflow-clip rounded-[24px] border border-[#262626] bg-[#171717] p-[20px]"
    >
      <p className="font-arima text-[15px] font-normal uppercase text-jneutral opacity-90">
        Άφησε μια ευχή
      </p>

      <textarea
        placeholder="Γράψε την ευχή σου για το ζευγάρι..."
        value={draft.message}
        onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
        maxLength={500}
        rows={3}
        required
        className="font-arima w-full resize-none rounded-[16px] border border-[#262626] bg-[#171717] px-[20px] py-[16px] text-[14px] text-jneutral placeholder:text-jneutral/60 focus:outline-none focus:ring-2 focus:ring-jpurple/40"
        aria-label="Η ευχή σου για το ζευγάρι"
      />

      <input
        type="text"
        placeholder="Το όνομά σου"
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        maxLength={100}
        required
        className="font-arima w-full rounded-[16px] border border-[#262626] bg-[#171717] px-[20px] py-[16px] text-[14px] text-jneutral placeholder:text-jneutral/60 focus:outline-none focus:ring-2 focus:ring-jpurple/40"
        aria-label="Your name"
      />

      <button
        type="submit"
        disabled={submitting}
        className="font-gb-mama-beba w-full rounded-[24px] bg-jpurple px-[16px] py-[8px] text-[17px] text-jneutral transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {submitting ? "Στέλνεται..." : "Στείλε ευχή"}
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <p className="font-arima text-right text-[14px] text-jneutral/60">
        {draft.message.length}/500
      </p>
    </form>
  );
}
