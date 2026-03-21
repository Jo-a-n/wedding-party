"use client";

import { useState, useCallback } from "react";

const NAME_SHIPS = [
  "Κωνιέλα",
  "Ντανσταντίνος",
  "Μικερεντίνος",
  "Μικελίνος",
  "Ντανιελίνος",
  "Ντανκωστίνη",
  "Κωνστανέλα",
  "Ντανκωστέλα",
  "Φερεντικέλη",
  "ΚωνσταΝταν",
  "ΚωΝτά",
  "Κωνστανέλα Φερεντικέλη",
  "Νταντανιέλα Κωκωνέλα",
  "Φεφερέλα Μιμικέλα",
  "Ντανσταντίνος Μικελίνος",
  "Ντανιελίνος Μικερεντίνος",
  "Κωνιέλα Φερεντικέλη",
  "Κωνσταντανιέλα Φερεντικέλη",
  "Κωντανιέλα Φερεντιέλα",
];

function randomIndex(exclude?: number) {
  let i: number;
  do {
    i = Math.floor(Math.random() * NAME_SHIPS.length);
  } while (i === exclude && NAME_SHIPS.length > 1);
  return i;
}

export function NameShip() {
  const [index, setIndex] = useState(() => randomIndex());

  const cycle = useCallback(() => {
    setIndex((prev) => randomIndex(prev));
  }, []);

  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex flex-col items-center cursor-pointer text-[16px] text-jneutral mt-[14px] transition-transform duration-150 hover:scale-105 active:scale-95"
    >
      <span>💕</span>
      <span>{NAME_SHIPS[index]}</span>
      <span>💕</span>
    </button>
  );
}
