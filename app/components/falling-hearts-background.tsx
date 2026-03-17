import type { CSSProperties } from "react";

const hearts = [
  { left: "4%", size: "1rem", delay: "-2s", duration: "10s", sway: "2.4s" },
  { left: "11%", size: "1.5rem", delay: "-7s", duration: "14s", sway: "3.1s" },
  { left: "18%", size: "1.1rem", delay: "-4s", duration: "11s", sway: "2.7s" },
  { left: "26%", size: "1.75rem", delay: "-10s", duration: "16s", sway: "3.4s" },
  { left: "34%", size: "0.95rem", delay: "-1s", duration: "9s", sway: "2.2s" },
  { left: "42%", size: "1.35rem", delay: "-8s", duration: "13s", sway: "3s" },
  { left: "50%", size: "1.05rem", delay: "-5s", duration: "12s", sway: "2.6s" },
  { left: "58%", size: "1.85rem", delay: "-11s", duration: "17s", sway: "3.8s" },
  { left: "66%", size: "1rem", delay: "-3s", duration: "10s", sway: "2.5s" },
  { left: "74%", size: "1.3rem", delay: "-9s", duration: "14s", sway: "3.2s" },
  { left: "82%", size: "0.9rem", delay: "-6s", duration: "11s", sway: "2.3s" },
  { left: "89%", size: "1.6rem", delay: "-12s", duration: "15s", sway: "3.5s" },
  { left: "95%", size: "1.15rem", delay: "-4.5s", duration: "12s", sway: "2.8s" },
];

export function FallingHeartsBackground() {
  return (
    <div aria-hidden="true" className="heart-bg">
      <div className="heart-bg__glow" />
      {hearts.map((heart) => (
        <span
          key={`${heart.left}-${heart.delay}`}
          className="heart-bg__column"
          style={
            {
              "--heart-left": heart.left,
              "--heart-size": heart.size,
              "--heart-delay": heart.delay,
              "--heart-duration": heart.duration,
              "--heart-sway-duration": heart.sway,
            } as CSSProperties
          }
        >
          <span className="heart-bg__heart">♥</span>
        </span>
      ))}
    </div>
  );
}
