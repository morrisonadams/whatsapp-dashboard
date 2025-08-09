import { useEffect, useState } from "react";
import { VIM_THEMES } from "./vimThemes";

export interface Palette {
  text: string;
  subtext: string;
  surfaces: string;
  series: string[];
}

export default function useThemePalette(): Palette {
  const getTheme = () => {
    if (typeof window === "undefined") return "gruvbox_dark";
    const saved = localStorage.getItem("theme");
    return saved && VIM_THEMES[saved] ? saved : "gruvbox_dark";
  };

  const [palette, setPalette] = useState<Palette>(() => {
    const t = VIM_THEMES[getTheme()];
    return { text: t.text, subtext: t.subtext, surfaces: t.surfaces, series: t.series };
  });

  useEffect(() => {
    const update = () => {
      const t = VIM_THEMES[getTheme()];
      setPalette({ text: t.text, subtext: t.subtext, surfaces: t.surfaces, series: t.series });
    };
    update();
    window.addEventListener("themechange", update);
    return () => window.removeEventListener("themechange", update);
  }, []);

  return palette;
}

