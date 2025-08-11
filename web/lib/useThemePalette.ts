export interface Palette {
  text: string;
  subtext: string;
  surfaces: string;
  series: string[];
}

// Palette tuned for the new gradient theme
const palette: Palette = {
  text: "#e2e8f0",
  subtext: "#94a3b8",
  surfaces: "rgba(255,255,255,0.05)",
  series: [
    "#5EEAD4",
    "#A78BFA",
    "#F472B6",
    "#34D399",
    "#818CF8",
    "#FB7185",
    "#2DD4BF",
    "#C084FC"
  ]
};

export default function useThemePalette(): Palette {
  return palette;
}
