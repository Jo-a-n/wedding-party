"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RiceToss } from "@/lib/supabase/types";

type Point = {
  x: number;
  y: number;
};

type ParticleBase = {
  id: number;
  x: number;
  y: number;
  initialX: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  life: number;
  maxLife: number;
  color: string;
  swayOffset: number;
  swaySpeed: number;
  swayAmount: number;
};

type RiceParticle = ParticleBase & {
  kind: "rice";
  length: number;
  width: number;
};

type TextParticle = ParticleBase & {
  kind: "counter" | "celebration";
  text: string;
  fontSize: number;
};

type Particle = RiceParticle | TextParticle;

type TossMode = "drag" | "touch-button";

const COLORS = ["#e789fa", "#1ef79a", "#f2ead5", "#9946f7", "#1dd0f0"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const distance = (a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
};

export function RiceCelebrationSection({
  initialCount,
}: {
  initialCount: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const touchButtonRef = useRef<HTMLButtonElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const nextParticleIdRef = useRef(0);
  const dragStartRef = useRef<Point | null>(null);
  const dragCurrentRef = useRef<Point | null>(null);
  const boundsRef = useRef({ width: 0, height: 0, dpr: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [riceCount, setRiceCount] = useState(initialCount);
  const riceCountRef = useRef(initialCount);
  const seenTossIdsRef = useRef<Set<number>>(new Set());
  const lastTossTimeRef = useRef(0);
  const TOSS_COOLDOWN_MS = 300;

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("rice-tosses-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rice_tosses" },
        (payload) => {
          const raw = payload.new;

          if (!raw || typeof raw.id !== "number") {
            return;
          }

          if (seenTossIdsRef.current.has(raw.id)) {
            return;
          }

          seenTossIdsRef.current.add(raw.id);
          riceCountRef.current += 1;
          setRiceCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;

      boundsRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr,
      };

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
    };

    const draw = () => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      const { width, height } = boundsRef.current;
      context.clearRect(0, 0, width, height);

      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.life += 1;

        if (particle.life >= particle.maxLife) {
          return false;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.24;
        particle.vx *= 0.985;
        particle.vy *= 0.992;
        particle.rotation += particle.spin;
        particle.x =
          particle.initialX +
          Math.sin(particle.life * particle.swaySpeed + particle.swayOffset) *
            particle.swayAmount;
        particle.initialX += particle.vx;

        const alpha = 1 - particle.life / particle.maxLife;

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.globalAlpha = alpha;
        context.fillStyle = particle.color;

        if (particle.kind === "rice") {
          context.fillRect(
            -particle.length / 2,
            -particle.width / 2,
            particle.length,
            particle.width,
          );
        } else {
          const weight = particle.kind === "celebration" ? "700" : "600";
          context.font = `${weight} ${particle.fontSize}px system-ui, sans-serif`;
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.strokeStyle = "rgba(0,0,0,0.2)";
          context.lineWidth = 2.5;
          context.strokeText(particle.text, 0, 0);
          context.fillText(particle.text, 0, 0);
        }

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

  const createBurst = async (
    start: Point,
    end: Point,
    mode: TossMode = "drag",
  ) => {
    const now = Date.now();
    if (now - lastTossTimeRef.current < TOSS_COOLDOWN_MS) return;
    lastTossTimeRef.current = now;

    const { height } = boundsRef.current;
    const dragLength = clamp(distance(start, end), 24, 140);
    const angle =
      mode === "touch-button"
        ? Math.atan2(end.y - start.y, end.x - start.x)
        : Math.atan2(start.y - end.y, start.x - end.x);
    const power = dragLength / 8;
    const particleCount = Math.round(clamp(dragLength / 2.6, 18, 54));

    const newParticles: Particle[] = Array.from(
      { length: particleCount },
      () => {
        const spread = (Math.random() - 0.5) * 0.85;
        const velocity = power * 0.95 + Math.random() * 4.5;
        const x = start.x;
        const y = clamp(start.y, 32, height - 28);

        return {
          kind: "rice" as const,
          id: nextParticleIdRef.current++,
          x,
          y,
          initialX: x,
          vx: Math.cos(angle + spread) * velocity,
          vy: Math.sin(angle + spread) * velocity,
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.35,
          length: 9 + Math.random() * 10,
          width: 2 + Math.random() * 2.4,
          life: 0,
          maxLife: 56 + Math.random() * 240,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          swayOffset: Math.random() * Math.PI * 2,
          swaySpeed: 0.08 + Math.random() * 0.05,
          swayAmount: 0.9 + Math.random() * 10,
        };
      },
    );

    const nextCount = (riceCountRef.current += 1);
    setRiceCount(nextCount);
    const originY = clamp(start.y, 32, height - 28);

    const counterParticle: TextParticle = {
      kind: "counter",
      id: nextParticleIdRef.current++,
      text: `Ρυζιά Νο ${nextCount.toLocaleString("el-GR")}`,
      fontSize: 15,
      x: start.x,
      y: originY,
      initialX: start.x,
      vx: Math.cos(angle) * power * 0.7,
      vy: Math.sin(angle) * power * 0.7,
      rotation: 0,
      spin: 0,
      life: 0,
      maxLife: 90,
      color: ["#d2fac3", "#f5d0e3", "#facdaa"][nextCount % 3],
      swayOffset: 0,
      swaySpeed: 0,
      swayAmount: 0,
    };

    newParticles.push(counterParticle);

    if (Math.random() < 1 / 25) {
      const celebrationParticle: TextParticle = {
        kind: "celebration",
        id: nextParticleIdRef.current++,
        text: "θα γλιστρήσουμε!",
        fontSize: 18,
        x: start.x,
        y: originY,
        initialX: start.x,
        vx: Math.cos(angle) * power * 0.5,
        vy: Math.sin(angle) * power * 0.5,
        rotation: 0,
        spin: 0,
        life: 0,
        maxLife: 160,
        color: "#f5d0e3",
        swayOffset: 0,
        swaySpeed: 0,
        swayAmount: 0,
      };

      newParticles.push(celebrationParticle);
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];

    const supabase = createClient();
    const { data, error } = await supabase
      .from("rice_tosses")
      .insert({})
      .select()
      .single();

    if (error) {
      console.error("Rice toss insert error:", error);
      riceCountRef.current -= 1;
      setRiceCount(riceCountRef.current);
      return;
    }

    const toss = data as RiceToss;
    seenTossIdsRef.current.add(toss.id);
  };

  const getPoint = (clientX: number, clientY: number) => {
    return {
      x: clientX,
      y: clientY,
    };
  };

  useEffect(() => {
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

    const updateTouchMode = () => {
      setIsTouchDevice(coarsePointerQuery.matches);
    };

    updateTouchMode();
    coarsePointerQuery.addEventListener("change", updateTouchMode);

    return () => {
      coarsePointerQuery.removeEventListener("change", updateTouchMode);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || isTouchDevice) {
        return;
      }

      const point = getPoint(event.clientX, event.clientY);
      dragStartRef.current = point;
      dragCurrentRef.current = point;
      setIsDragging(true);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStartRef.current || !event.isPrimary || isTouchDevice) {
        return;
      }

      dragCurrentRef.current = getPoint(event.clientX, event.clientY);
    };

    const finishLaunch = (event: PointerEvent) => {
      if (!event.isPrimary || isTouchDevice) {
        return;
      }

      const start = dragStartRef.current;
      const end =
        dragCurrentRef.current ?? getPoint(event.clientX, event.clientY);

      if (start) {
        void createBurst(start, end, "drag");
      }

      dragStartRef.current = null;
      dragCurrentRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishLaunch);
    window.addEventListener("pointercancel", finishLaunch);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishLaunch);
      window.removeEventListener("pointercancel", finishLaunch);
    };
  }, [isTouchDevice]);

  const [tossKey, setTossKey] = useState(0);

  const handleTouchToss = () => {
    const button = touchButtonRef.current;

    if (!button) {
      return;
    }

    setTossKey((k) => k + 1);

    const rect = button.getBoundingClientRect();
    const start = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    const end = {
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 80,
      y: window.innerHeight / 4.8 + (Math.random() - 0.5) * 120,
    };

    void createBurst(start, end, "touch-button");
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-20 h-full w-full"
        aria-hidden="true"
      />

      <section id="rice" className="relative z-10 py-8">
        <div className="flex flex-col items-center gap-5 py-6">
          <h2 className="font-gb-mama-beba text-[36px] text-jneutral text-center px-8">
            Ρίξε ρύζι, ο γάμος να μη τρίζει!
          </h2>

          <p className="font-playpen font-[200] text-[15px] text-jneutral/90 text-center w-[282px]">
            Σύρε και πέτα ρύζι! Κανονικά θα σκούπιζε ο γαμπρός, αλλά εδώ είμαστε
            online.
          </p>

          <div className="flex flex-col items-center gap-3.5">
            {/* Counter with decorative confetti SVG */}
            <div className="relative flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/rice-counter-confetti.svg"
                alt=""
                aria-hidden="true"
                className="pointer-events-none h-[109px] w-[158px] scale-110 z-50"
              />
              {/* Green pill counter on top */}
              <div className="absolute flex items-center justify-center rounded-[24px] bg-jgreen px-6 py-3">
                <span className="font-gb-mama-beba text-[36px] leading-none text-dark">
                  {riceCount.toLocaleString("el-GR")}
                </span>
              </div>
            </div>
            {/* Counter label */}
            <p className="font-gb-mama-beba text-[22px] text-jneutral">
              ΡΥΖΙΕΣ ΚΑΟΥΝΤΕΡ
            </p>
          </div>
        </div>
      </section>

      {isTouchDevice ? (
        <div className="fixed bottom-5 right-5 z-30 sm:bottom-8 sm:right-8">
          <button
            key={`btn-${tossKey}`}
            ref={touchButtonRef}
            type="button"
            onClick={handleTouchToss}
            className="relative rounded-full bg-[#1ef79a] px-4 py-2.5 font-gb-mama-beba text-[17px] text-black shadow-[0_18px_35px_rgba(0,0,0,0.16)] animate-[toss-pop_120ms_ease-out]"
          >
            Ρίξε ρύζι!
          </button>
          <img
            key={`svg-${tossKey}`}
            src="/rice-confetti.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -left-[32px] -top-[28px] z-10 h-[90px] w-[120px] animate-[toss-pop-deep_150ms_ease-out]"
          />
        </div>
      ) : null}
    </>
  );
}
