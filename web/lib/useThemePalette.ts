import { useEffect, useState } from "react";

export interface Palette {
  text: string;
  subtext: string;
  surfaces: string;
  series: string[];
}

function hexToHsl(hex: string): [number, number, number] {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map(c => c + c).join("");
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generateSeries(base: string): string[] {
  const [h, s, l] = hexToHsl(base);
  const series: string[] = [];
  for (let i = -2; i < 4; i++) {
    const hue = (h + i * 20 + 360) % 360;
    const light = Math.min(90, Math.max(20, l + i * 10));
    series.push(hslToHex(hue, s, light));
  }
  return series;
}

export default function useThemePalette(): Palette {
  const [palette, setPalette] = useState<Palette>({
    text: "#e2e8f0",
    subtext: "#94a3b8",
    surfaces: "#1e293b",
    series: ["#7dd3fc", "#c4b5fd", "#f9a8d4", "#fdba74", "#fca5a5", "#bef264"],
  });

  useEffect(() => {
    const update = () => {
      const root = getComputedStyle(document.documentElement);
      const text = root.getPropertyValue("--text-color").trim() || "#e2e8f0";
      const subtext = root.getPropertyValue("--sub-color").trim() || "#94a3b8";
      const surfaces = root.getPropertyValue("--sub-alt-color").trim() || "#1e293b";
      const main = root.getPropertyValue("--main-color").trim() || "#7dd3fc";
      setPalette({ text, subtext, surfaces, series: generateSeries(main) });
    };
    update();
    window.addEventListener("themechange", update);
    return () => window.removeEventListener("themechange", update);
  }, []);

  return palette;
}

