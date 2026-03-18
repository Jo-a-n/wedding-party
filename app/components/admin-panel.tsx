"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin";
import type { SiteSettings } from "../page";

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDatetime(local: string): string {
  return new Date(local).toISOString();
}

const LABELS: Record<keyof SiteSettings, string> = {
  ceremony_start: "Ceremony start",
  ceremony_end: "Ceremony end",
  wish_deadline: "Wishes close",
  gallery_deadline: "Gallery closes",
};

export function AdminPanel({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [values, setValues] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, string> = {};
    for (const key of Object.keys(values) as (keyof SiteSettings)[]) {
      payload[key] = values[key];
    }
    const res = await adminFetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <section className="py-4">
      <div className="rounded-2xl border-2 border-red-500/30 bg-red-500/5 p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
          Admin — Datetimes
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(LABELS) as (keyof SiteSettings)[]).map((key) => (
            <label key={key} className="block">
              <span className="text-xs font-medium text-ink-soft">
                {LABELS[key]}
              </span>
              <input
                type="datetime-local"
                value={toLocalDatetime(values[key])}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    [key]: fromLocalDatetime(e.target.value),
                  }))
                }
                className="mt-1 block w-full rounded-xl border border-border-soft bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-red-500/80 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:bg-red-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save datetimes"}
          </button>
        </div>
      </div>
    </section>
  );
}
