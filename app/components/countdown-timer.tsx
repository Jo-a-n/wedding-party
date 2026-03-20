"use client";

import { useEffect, useState, useMemo } from "react";
import type { SiteSettings } from "../page";

type TimerState = "countdown" | "in-progress" | "married";

function pluralize(n: number, one: string, other: string) {
  return n === 1 ? one : other;
}

function formatDiff(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

const IN_PROGRESS_MESSAGES = [
  "Γάμος σε εξέλιξη... 💍",
  "Παντρεύονται αυτή τη στιγμή! 🥂",
  "Σσσς... λένε το «Ναι»! 🤫",
];

export function CountdownTimer({ settings }: { settings: SiteSettings }) {
  const [now, setNow] = useState(() => Date.now());

  const ceremonyStart = useMemo(() => new Date(settings.ceremony_start), [settings.ceremony_start]);
  const ceremonyEnd = useMemo(() => new Date(settings.ceremony_end), [settings.ceremony_end]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const state: TimerState =
    now < ceremonyStart.getTime() ? "countdown" :
    now < ceremonyEnd.getTime() ? "in-progress" :
    "married";

  if (state === "countdown") {
    const diff = formatDiff(ceremonyStart.getTime() - now);
    return (
      <section className="py-6">
        <div className="font-gb-mama-beba soft-card rounded-[2rem] px-5 py-6 text-center sm:px-8 sm:py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-soft">
            Αντίστροφη μέτρηση
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 sm:gap-5">
            <TimeUnit
              value={diff.days}
              label={pluralize(diff.days, "μέρα", "μέρες")}
            />
            <Separator />
            <TimeUnit
              value={diff.hours}
              label={pluralize(diff.hours, "ώρα", "ώρες")}
            />
            <Separator />
            <TimeUnit
              value={diff.minutes}
              label={pluralize(diff.minutes, "λεπτό", "λεπτά")}
            />
            <Separator />
            <TimeUnit
              value={diff.seconds}
              label={pluralize(diff.seconds, "δευτερόλεπτο", "δευτερόλεπτα")}
            />
          </div>
        </div>
      </section>
    );
  }

  if (state === "in-progress") {
    const messageIndex = Math.floor((now / 4000) % IN_PROGRESS_MESSAGES.length);
    return (
      <section className="py-6">
        <div className="font-gb-mama-beba soft-card rounded-[2rem] px-5 py-8 text-center sm:px-8 sm:py-10">
          <p className="ceremony-pulse text-2xl font-semibold text-foreground sm:text-3xl">
            {IN_PROGRESS_MESSAGES[messageIndex]}
          </p>
        </div>
      </section>
    );
  }

  // married state
  const diff = formatDiff(now - ceremonyEnd.getTime());
  return (
    <section className="py-6">
      <div className="font-gb-mama-beba soft-card rounded-[2rem] px-5 py-6 text-center sm:px-8 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-soft">
          Παντρεμένοι εδώ και
        </p>
        <div className="mt-4 flex items-center justify-center gap-3 sm:gap-5">
          {diff.days > 0 && (
            <>
              <TimeUnit
                value={diff.days}
                label={pluralize(diff.days, "μέρα", "μέρες")}
              />
              <Separator />
            </>
          )}
          <TimeUnit
            value={diff.hours}
            label={pluralize(diff.hours, "ώρα", "ώρες")}
          />
          <Separator />
          <TimeUnit
            value={diff.minutes}
            label={pluralize(diff.minutes, "λεπτό", "λεπτά")}
          />
          <Separator />
          <TimeUnit
            value={diff.seconds}
            label={pluralize(diff.seconds, "δευτερόλεπτο", "δευτερόλεπτα")}
          />
        </div>
      </div>
    </section>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-bold tabular-nums text-foreground sm:text-5xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[0.65rem] uppercase tracking-wider text-ink-soft sm:text-xs">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span
      className="text-2xl font-light text-ink-soft/40 sm:text-4xl"
      aria-hidden
    >
      :
    </span>
  );
}
