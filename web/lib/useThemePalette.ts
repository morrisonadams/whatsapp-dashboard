import { useEffect, useState } from "react";
import { KEYCAP_THEMES, KEYCAP_THEME_NAMES } from "./keycapThemes";

export interface Palette {
  text: string;
  subtext: string;
  surfaces: string;
  series: string[];
}

export default function useThemePalette(): Palette {
  const getTheme = () => {
    if (typeof window === "undefined") return KEYCAP_THEME_NAMES[0];
    const saved = localStorage.getItem("theme");
    return saved && KEYCAP_THEMES[saved] ? saved : KEYCAP_THEME_NAMES[0];
  };

  const [palette, setPalette] = useState<Palette>(() => {
    const t = KEYCAP_THEMES[getTheme()];
    return { text: t.text, subtext: t.subtext, surfaces: t.surfaces, series: t.series };
  });

  useEffect(() => {
    const update = () => {
      const t = KEYCAP_THEMES[getTheme()];
      setPalette({ text: t.text, subtext: t.subtext, surfaces: t.surfaces, series: t.series });
    };
    update();
    window.addEventListener("themechange", update);
    return () => window.removeEventListener("themechange", update);
  }, []);

  return palette;
}

