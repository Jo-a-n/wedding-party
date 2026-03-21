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

const DATETIME_LABELS: Record<string, string> = {
  ceremony_start: "Ceremony start",
  ceremony_end: "Ceremony end",
  wish_deadline: "Wishes close",
  gallery_deadline: "Gallery closes",
};

const TEXT_LABELS: Record<string, string> = {
  large_upload_album_url: "Large upload album URL",
};

const TOGGLE_LABELS: Record<string, string> = {
  show_google_album_link: "Show Google album link",
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
          {(Object.keys(DATETIME_LABELS) as (keyof SiteSettings)[]).map((key) => (
            <label key={key} className="block">
              <span className="text-xs font-medium text-ink-soft">
                {DATETIME_LABELS[key]}
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
                className="mt-1 block w-full rounded-xl border border-border-soft bg-transparent px-3 py-2 text-sm text-jneutral focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3">
          {(Object.keys(TEXT_LABELS) as (keyof SiteSettings)[]).map((key) => (
            <label key={key} className="block">
              <span className="text-xs font-medium text-ink-soft">
                {TEXT_LABELS[key]}
              </span>
              <input
                type="url"
                value={values[key]}
                placeholder="https://photos.google.com/..."
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    [key]: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-xl border border-border-soft bg-transparent px-3 py-2 text-sm text-jneutral placeholder:text-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3">
          {(Object.keys(TOGGLE_LABELS) as (keyof SiteSettings)[]).map((key) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={values[key] === "true"}
                onClick={() =>
                  setValues((v) => ({
                    ...v,
                    [key]: v[key] === "true" ? "false" : "true",
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${values[key] === "true" ? "bg-red-500/80" : "bg-border-soft"}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${values[key] === "true" ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
              <span className="text-xs font-medium text-ink-soft">
                {TOGGLE_LABELS[key]}
              </span>
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
