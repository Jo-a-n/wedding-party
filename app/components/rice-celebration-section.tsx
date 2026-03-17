"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Point = {
  x: number;
  y: number;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  length: number;
  width: number;
  life: number;
  maxLife: number;
  color: string;
};

const COLORS = ["#fffdfb", "#ffffff", "#f5d0e3", "#facdaa", "#d2fac3"];
const STORAGE_KEY = "wedding-party-rice-count";
const STORAGE_EVENT = "rice-count-updated";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const distance = (a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
};

const getStoredRiceCount = () => {
  if (typeof window === "undefined") {
    return 0;
  }

  const savedCount = window.localStorage.getItem(STORAGE_KEY);

  if (!savedCount) {
    return 0;
  }

  const parsedCount = Number.parseInt(savedCount, 10);

  return Number.isFinite(parsedCount) && parsedCount >= 0 ? parsedCount : 0;
};

const subscribeToRiceCount = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORAGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
};

export function RiceCelebrationSection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const nextParticleIdRef = useRef(0);
  const dragStartRef = useRef<Point | null>(null);
  const dragCurrentRef = useRef<Point | null>(null);
  const boundsRef = useRef({ width: 0, height: 0, dpr: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const riceCount = useSyncExternalStore(
    subscribeToRiceCount,
    getStoredRiceCount,
    () => 0,
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      boundsRef.current = {
        width: rect.width,
        height: rect.height,
        dpr,
      };

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
    };

    const draw = () => {
      const { width, height } = boundsRef.current;
      context.clearRect(0, 0, width, height);

      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.life += 1;

        if (particle.life >= particle.maxLife) {
          return false;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.18;
        particle.vx *= 0.995;
        particle.rotation += particle.spin;

        const alpha = 1 - particle.life / particle.maxLife;

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.globalAlpha = alpha;
        context.fillStyle = particle.color;
        context.fillRect(
          -particle.length / 2,
          -particle.width / 2,
          particle.length,
          particle.width,
        );
        context.restore();

        return particle.y < height + 40;
      });

      const start = dragStartRef.current;
      const current = dragCurrentRef.current;

      if (start && current) {
        context.save();
        context.strokeStyle = "rgba(199, 189, 220, 0.42)";
        context.lineWidth = 2;
        context.setLineDash([8, 10]);
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(current.x, current.y);
        context.stroke();
        context.setLineDash([]);

        context.fillStyle = "rgba(255, 255, 255, 0.9)";
        context.beginPath();
        context.arc(start.x, start.y, 8, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = "rgba(255, 255, 255, 0.76)";
        context.beginPath();
        context.arc(current.x, current.y, 14, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      }

      frameRef.current = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    frameRef.current = window.requestAnimationFrame(draw);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }

      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const createBurst = (start: Point, end: Point) => {
    const { height } = boundsRef.current;
    const dragLength = clamp(distance(start, end), 24, 140);
    const angle = Math.atan2(start.y - end.y, start.x - end.x);
    const power = dragLength / 8;
    const particleCount = Math.round(clamp(dragLength / 2.6, 18, 54));

    const newParticles = Array.from({ length: particleCount }, () => {
      const spread = (Math.random() - 0.5) * 1.15;
      const velocity = power + Math.random() * 5;

      return {
        id: nextParticleIdRef.current++,
        x: start.x,
        y: clamp(start.y, 32, height - 28),
        vx: Math.cos(angle + spread) * velocity,
        vy: Math.sin(angle + spread) * velocity,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.35,
        length: 8 + Math.random() * 10,
        width: 2 + Math.random() * 2.4,
        life: 0,
        maxLife: 48 + Math.random() * 34,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });

    particlesRef.current = [...particlesRef.current, ...newParticles];
    const nextCount = riceCount + 1;
    window.localStorage.setItem(STORAGE_KEY, String(nextCount));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  };

  const getPoint = (
    event: React.PointerEvent<HTMLDivElement>,
    element: HTMLDivElement,
  ) => {
    const rect = element.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = getPoint(event, event.currentTarget);
    dragStartRef.current = point;
    dragCurrentRef.current = point;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) {
      return;
    }

    dragCurrentRef.current = getPoint(event, event.currentTarget);
  };

  const finishLaunch = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    const end = dragCurrentRef.current ?? getPoint(event, event.currentTarget);

    if (start) {
      createBurst(start, end);
    }

    dragStartRef.current = null;
    dragCurrentRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section id="rice" className="py-8">
      <div className="overflow-hidden ">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className=" py-8 sm:px-8 sm:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink-soft">
              Interactive moment
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
              Ρύζι στα παιδιά!
            </h2>

            <div className="soft-card mt-8 inline-flex flex-row items-center gap-3 rounded-[1.5rem] px-4 py-3 shadow-sm">
              <div className="hero-accent-button flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold">
                {riceCount.toLocaleString("el-GR")}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-soft">
                  Total tosses (in this device)
                </p>
              </div>
            </div>
          </div>

          <div className="spotlight-stage">
            <div
              className="launcher-surface rice-launcher relative h-[360px] touch-none overflow-hidden rounded-[2rem] border border-white/20 sm:h-[420px]"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishLaunch}
              onPointerCancel={finishLaunch}
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full"
                aria-hidden="true"
              />

              <div className="soft-card pointer-events-none absolute inset-x-5 top-5 rounded-[1.5rem] px-4 py-3 text-sm text-foreground/75 shadow-sm sm:inset-x-6 sm:top-6">
                {isDragging
                  ? "Άφησε το δάχτυλο για να ξεκινήσει η ρίψη."
                  : "Πάτησε και σύρε για να πετάξεις ρύζι!"}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center sm:bottom-6">
                <div className="soft-chip-strong rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink-soft">
                  Rice toss zone
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
