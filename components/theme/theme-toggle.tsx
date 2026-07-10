"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "a-klassenhoiz.theme";
const THEME_CHANGE_EVENT = "a-klassenhoiz.theme-change";
export type ThemePreference = "system" | "dark" | "light";
type ResolvedTheme = Exclude<ThemePreference, "system">;

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Laptop;
}> = [
  { value: "system", label: "System", icon: Laptop },
  { value: "light", label: "Hell", icon: Sun },
  { value: "dark", label: "Dunkel", icon: Moon },
];

function readThemePreference(): ThemePreference {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") {
    return preference;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

export function ThemeToggle() {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    readThemePreference,
    () => "system" as const,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      if (readThemePreference() === "system") {
        applyTheme("system");
      }
    };

    applyTheme(preference);
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, [preference]);

  function handleChange(nextPreference: ThemePreference) {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    applyTheme(nextPreference);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
  }

  return (
    <div className="theme-setting">
      <div className="theme-setting-copy">
        <span className="setting-icon">
          <Sun aria-hidden="true" size={18} />
        </span>
        <div>
          <strong>Darstellung</strong>
          <p>Farbschema für diese App</p>
        </div>
      </div>
      <div className="theme-toggle" role="radiogroup" aria-label="Darstellung">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = preference === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={isSelected ? "is-active" : undefined}
              onClick={() => handleChange(option.value)}
            >
              <Icon aria-hidden="true" size={16} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
