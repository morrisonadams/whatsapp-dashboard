import { useEffect, useState } from "react";
import { KEYCAP_THEMES, KEYCAP_THEME_NAMES, KeycapTheme } from "./keycapThemes";

export interface Palette {
  text: string;
  subtext: string;
  surfaces: string;
  series: string[];
}

function clamp(value: number, min = 0, max = 255): number {
  return Math.min(Math.max(value, min), max);
}

function hex(v: number): string {
  const h = v.toString(16).toUpperCase();
  return h.length === 1 ? `0${h}` : h;
}

function lighten(color: string, percent: number): string {
  const num = parseInt(color.slice(1), 16);
  let r = num >> 16;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = clamp(Math.round(r + (255 - r) * (percent / 100)));
  g = clamp(Math.round(g + (255 - g) * (percent / 100)));
  b = clamp(Math.round(b + (255 - b) * (percent / 100)));
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function darken(color: string, percent: number): string {
  const num = parseInt(color.slice(1), 16);
  let r = num >> 16;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = clamp(Math.round(r * (1 - percent / 100)));
  g = clamp(Math.round(g * (1 - percent / 100)));
  b = clamp(Math.round(b * (1 - percent / 100)));
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function extendSeries(theme: KeycapTheme): string[] {
  const extra = [
    lighten(theme.main, 20),
    darken(theme.main, 20),
    lighten(theme.surfaces, 20)
  ];
  return theme.series.concat(extra);
}

export default function useThemePalette(): Palette {
  const getTheme = () => {
    if (typeof window === "undefined") return KEYCAP_THEME_NAMES[0];
    const saved = localStorage.getItem("theme");
    return saved && KEYCAP_THEMES[saved] ? saved : KEYCAP_THEME_NAMES[0];
  };

  const [palette, setPalette] = useState<Palette>(() => {
    const t = KEYCAP_THEMES[getTheme()];
    return { text: t.text, subtext: t.subtext, surfaces: t.surfaces, series: extendSeries(t) };
  });

  useEffect(() => {
    const update = () => {
      const t = KEYCAP_THEMES[getTheme()];
      setPalette({ text: t.text, subtext: t.subtext, surfaces: t.surfaces, series: extendSeries(t) });
    };
    update();
    window.addEventListener("themechange", update);
    return () => window.removeEventListener("themechange", update);
  }, []);

  return palette;
}

