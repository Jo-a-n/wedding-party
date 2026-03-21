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
  const [now, setNow] = useState<number | null>(null);

  const ceremonyStart = useMemo(
    () => new Date(settings.ceremony_start),
    [settings.ceremony_start],
  );
  const ceremonyEnd = useMemo(
    () => new Date(settings.ceremony_end),
    [settings.ceremony_end],
  );

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return (
      <section className="py-6">
        <div className="font-gb-mama-beba px-5 py-6 text-center sm:px-8 sm:py-8">
          <p className="relative mx-auto mb-6 inline-block text-[28px] text-jneutral sm:text-[28px]">
            Αντίστροφη{" "}
            <span className="relative text-jgreen">
              Μέτρηση
              <img
                src="/clock.svg"
                alt=""
                className="absolute -top-[39px] -right-[33px] h-[76px] w-[76px] sm:-top-[45px] sm:-right-[37px] sm:h-[90px] sm:w-[90px]"
              />
            </span>
          </p>
          <div className="flex items-start justify-center gap-3 sm:gap-5">
            <TimeUnit value={0} label="μέρες" />
            <Separator />
            <TimeUnit value={0} label="ώρες" />
            <Separator />
            <TimeUnit value={0} label="λεπτά" />
            <Separator />
            <TimeUnit value={0} label="δ/λεπτά" />
          </div>
        </div>
      </section>
    );
  }

  const state: TimerState =
    now < ceremonyStart.getTime()
      ? "countdown"
      : now < ceremonyEnd.getTime()
        ? "in-progress"
        : "married";

  if (state === "countdown") {
    const diff = formatDiff(ceremonyStart.getTime() - now);
    return (
      <section className="py-6">
        <div className="font-gb-mama-beba px-5 py-6 text-center sm:px-8 sm:py-8">
          <p className="relative mx-auto mb-6 inline-block text-[28px] text-jneutral sm:text-[28px]">
            Αντίστροφη{" "}
            <span className="relative text-jgreen">
              Μέτρηση
              <img
                src="/clock.svg"
                alt=""
                className="absolute -top-[39px] -right-[33px] h-[76px] w-[76px] sm:-top-[45px] sm:-right-[37px] sm:h-[90px] sm:w-[90px]"
              />
            </span>
          </p>
          <div className="flex items-start justify-center gap-3 sm:gap-5">
            <TimeUnit value={diff.days} label="μέρες" />
            <Separator />
            <TimeUnit value={diff.hours} label="ώρες" />
            <Separator />
            <TimeUnit value={diff.minutes} label="λεπτά" />
            <Separator />
            <TimeUnit value={diff.seconds} label="δ/λεπτά" />
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
          <p className="ceremony-pulse text-2xl font-semibold text-jneutral sm:text-3xl">
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
      <div className="font-gb-mama-beba px-5 py-6 text-center sm:px-8 sm:py-8">
        <p className="relative mx-auto mb-6 inline-block text-[28px] text-jneutral sm:text-[28px]">
          Παντρεμένοι εδώ{" "}
          <span className="relative text-jgreen">
            και
            <img
              src="/clock.svg"
              alt=""
              className="absolute -top-[39px] -right-[43px] h-[76px] w-[76px] sm:-top-[45px] sm:-right-[47px] sm:h-[90px] sm:w-[90px]"
            />
          </span>
        </p>
        <div className="flex items-start justify-center gap-3 sm:gap-5">
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
            label={pluralize(diff.seconds, "δ/λεπτο", "δ/λεπτα")}
          />
        </div>
      </div>
    </section>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[46px] font-bold tabular-nums text-jneutral sm:text-[64px]">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[15px] font-[400] uppercase text-jneutral opacity-70 sm:text-[15px]">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span
      className="mt-[10px] text-[32px] font-bold text-jneutral opacity-30 sm:mt-[14px] sm:text-[50px]"
      aria-hidden
    >
      :
    </span>
  );
}
