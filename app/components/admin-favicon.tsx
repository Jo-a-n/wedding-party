"use client";

import { useEffect } from "react";

export function AdminFavicon() {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      link.href =
        "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔑</text></svg>";
    }
  }, []);
  return null;
}
