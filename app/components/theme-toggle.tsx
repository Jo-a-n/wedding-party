"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "wedding-party-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    applyTheme(nextTheme);
    setTheme(nextTheme);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="soft-chip rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors duration-200 hover:bg-pink/60"
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} theme` : "Toggle theme"}
      aria-pressed={theme === "dark"}
    >
      {mounted ? (theme === "dark" ? "Light theme" : "Dark theme") : "Theme"}
    </button>
  );
}
