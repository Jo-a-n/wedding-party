"use client";

export function WeddingDogs() {
  return (
    <div className="flex items-end justify-center gap-6 sm:gap-12 py-6">
      <img
        src="/dogs/leo.png"
        alt="Leo in a tuxedo"
        className="dog-wiggle h-48 sm:h-64 lg:h-80 w-auto drop-shadow-lg"
        loading="eager"
      />
      <span
        className="text-3xl sm:text-4xl animate-pulse select-none pb-4"
        aria-hidden="true"
      >
        🐾
      </span>
      <img
        src="/dogs/casper.png"
        alt="Casper in a tuxedo"
        className="dog-wiggle dog-wiggle-alt h-48 sm:h-64 lg:h-80 w-auto drop-shadow-lg"
        loading="eager"
      />
    </div>
  );
}
