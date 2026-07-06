"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";

const THEME_STORAGE_KEY = "a-klassenhoiz.theme";
type ThemeMode = "dark" | "light";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function readTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());

  function handleToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  const isLight = theme === "light";

  return (
    <div className="theme-setting">
      <div>
        <span>
          {isLight ? <Sun aria-hidden="true" size={16} /> : <Moon aria-hidden="true" size={16} />}
        </span>
        <div>
          <strong>Darstellung</strong>
          <p>{isLight ? "Light Mode ist aktiv." : "Dark Mode ist aktiv."}</p>
        </div>
      </div>
      <button
        type="button"
        className="theme-toggle"
        role="switch"
        aria-checked={isLight}
        aria-label="Light Mode umschalten"
        onClick={handleToggle}
      >
        <span aria-hidden="true">{isLight ? "Light" : "Dark"}</span>
      </button>
    </div>
  );
}
