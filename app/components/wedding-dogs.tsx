"use client";

import { NameShip } from "./name-ship";

export function WeddingDogs() {
  return (
    <div className="flex items-end justify-center gap-6 sm:gap-12 py-6">
      <img
        src="/dogs/leo.png"
        alt="Leo in a tuxedo"
        className="dog-wiggle h-48 sm:h-64 lg:h-80 w-auto drop-shadow-lg"
        loading="eager"
      />
      <div className="relative self-center flex items-center justify-center">
        <img
          src="/heart.svg"
          alt=""
          className="w-[152px] sm:w-[200px] lg:w-[240px] h-auto scale-[1.1]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <NameShip />
        </div>
      </div>
      <img
        src="/dogs/casper.png"
        alt="Casper in a tuxedo"
        className="dog-wiggle dog-wiggle-alt h-48 sm:h-64 lg:h-80 w-auto drop-shadow-lg"
        loading="eager"
      />
    </div>
  );
}
