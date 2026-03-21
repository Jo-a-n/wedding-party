"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { classifyFile } from "@/lib/media-utils";

type ConfirmationFile = {
  file: File;
  objectUrl: string;
  isVideo: boolean;
};

export function UploadConfirmationModal({
  files,
  overLimitCount,
  oversizedFiles = [],
  albumUrl,
  onConfirm,
  onCancel,
}: {
  files: File[];
  overLimitCount: number;
  oversizedFiles?: File[];
  albumUrl?: string;
  onConfirm: (files: File[]) => void;
  onCancel: () => void;
}) {
  const [items, setItems] = useState<ConfirmationFile[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Create object URLs on mount, revoke on unmount
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;

    const mapped = files.map((file) => ({
      file,
      objectUrl: URL.createObjectURL(file),
      isVideo: classifyFile(file) === "video",
    }));
    setItems(mapped);

    return () => {
      mapped.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    };
  }, [files]);

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Focus trap and keyboard handling
  useEffect(() => {
    modalRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // History state for mobile back button
  useEffect(() => {
    history.pushState({ uploadConfirm: true }, "");

    function handlePopState(e: PopStateEvent) {
      if (!e.state?.uploadConfirm) {
        onCancel();
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Clean up the history entry if modal closes normally
      if (history.state?.uploadConfirm) {
        history.back();
      }
    };
  }, [onCancel]);

  // Restore focus on unmount
  useEffect(() => {
    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  const removeFile = useCallback((index: number) => {
    setItems((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.objectUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleConfirm = () => {
    const remaining = items.map((item) => item.file);
    // Revoke URLs before closing
    items.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    onConfirm(remaining);
  };

  const handleCancel = () => {
    items.forEach((item) => URL.revokeObjectURL(item.objectUrl));
    onCancel();
  };

  const count = items.length;

  const actionBar = (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={handleCancel}
        className="font-arima rounded-[24px] border border-[#262626] px-5 py-2 text-[14px] text-jneutral/80 transition-colors hover:bg-white/5"
      >
        Ακύρωση
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={count === 0}
        className="font-gb-mama-beba rounded-[24px] bg-jpurple px-5 py-2 text-[17px] text-jneutral transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {count > 0 ? `Ανέβασε ${count}` : "Ανέβασε"}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-upload-heading"
        tabIndex={-1}
        className="relative flex max-h-[100dvh] w-full flex-col overflow-clip bg-[#171717] outline-none sm:max-h-[85vh] sm:max-w-lg sm:rounded-[24px] sm:border sm:border-[#262626]"
      >
        {/* Header + top action bar */}
        <div className="shrink-0 space-y-3 border-b border-[#262626] p-4 sm:p-5">
          <h2
            id="confirm-upload-heading"
            className="font-arima text-[15px] font-normal uppercase text-jneutral opacity-90"
          >
            Επιβεβαίωση αρχείων ({count})
          </h2>
          {actionBar}
        </div>

        {/* Scrollable thumbnail grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {overLimitCount > 0 && (
            <p className="font-arima mb-4 rounded-[16px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-400">
              Επιλέξατε {count + overLimitCount} αρχεία αλλά μόνο 10 μπορούν
              να ανεβούν κάθε φορά. Εμφανίζονται τα πρώτα 10.
            </p>
          )}

          {oversizedFiles.length > 0 && (
            <div className="font-arima mb-4 rounded-[16px] border border-amber-500/20 bg-amber-500/10 p-4 text-[13px] text-jneutral">
              <p className="font-[500]">
                {oversizedFiles.length === 1
                  ? "Ένα αρχείο είναι πολύ μεγάλο για ανέβασμα εδώ:"
                  : `${oversizedFiles.length} αρχεία είναι πολύ μεγάλα για ανέβασμα εδώ:`}
              </p>
              <ul className="mt-1.5 list-disc pl-4 space-y-0.5">
                {oversizedFiles.map((f) => (
                  <li key={f.name}>
                    {f.name} ({Math.round(f.size / (1024 * 1024))} MB)
                  </li>
                ))}
              </ul>
              {albumUrl ? (
                <div className="mt-3">
                  <a
                    href={albumUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-gb-mama-beba inline-flex items-center gap-2 rounded-[24px] bg-jpurple px-4 py-2.5 text-[17px] text-white transition-all hover:brightness-110"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Ανεβάστε τα στο Google Photos album μας
                  </a>
                  <p className="mt-1.5 text-[16px] text-jpurple/70 underline break-all">
                    {albumUrl}
                  </p>
                </div>
              ) : (
                <p className="mt-2.5">
                  Ο σύνδεσμος για ανέβασμα μεγάλων αρχείων θα είναι διαθέσιμος
                  σύντομα.
                </p>
              )}
            </div>
          )}

          {count === 0 ? (
            oversizedFiles.length === 0 ? (
              <p className="font-arima py-8 text-center text-[14px] text-jneutral/60">
                Δεν επιλέχθηκαν αρχεία.
              </p>
            ) : null
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((item, index) => (
                <div key={item.objectUrl} className="group relative">
                  <div className="aspect-square overflow-hidden rounded-[16px] border border-[#262626] bg-[#171717]">
                    {item.isVideo ? (
                      <div className="flex h-full flex-col items-center justify-center gap-1.5 p-2">
                        <svg
                          className="h-8 w-8 text-jneutral/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                          />
                        </svg>
                        <span className="font-arima max-w-full truncate text-[11px] text-jneutral/60">
                          {item.file.name}
                        </span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.objectUrl}
                        alt={item.file.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // HEIC fallback on unsupported browsers
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement("div");
                            fallback.className =
                              "flex h-full flex-col items-center justify-center gap-1.5 p-2";
                            fallback.innerHTML = `
                              <svg class="h-8 w-8 text-jneutral/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                              </svg>
                              <span class="font-arima max-w-full truncate text-[11px] text-jneutral/60">${item.file.name}</span>
                            `;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    aria-label={`Remove ${item.file.name}`}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md transition-transform hover:scale-110"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
