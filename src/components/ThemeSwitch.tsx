"use client";

import { useEffect } from "react";

const KEY = "nb-theme";

function apply(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(KEY, theme); } catch { /* modo privado */ }
}

/** El aspecto lo pinta `data-theme` en `<html>`. El script del layout lo
 *  pone antes de pintar; aquí se reafirma por si la hidratación lo pisa. */
export function ThemeSwitch() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
    } catch { /* modo privado */ }
  }, []);

  const toggle = () => {
    apply(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      className="theme-switch"
      onClick={toggle}
      aria-label="Cambiar entre modo claro y oscuro"
    >
      <span className="theme-switch-track" aria-hidden="true">
        <span className="theme-switch-knob" />
      </span>
      <span className="theme-label theme-label-light">Claro</span>
      <span className="theme-label theme-label-dark">Oscuro</span>
    </button>
  );
}
