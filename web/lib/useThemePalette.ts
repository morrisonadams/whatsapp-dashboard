export interface Palette {
  text: string;
  subtext: string;
  surfaces: string;
  series: string[];
}

// Static dark palette similar to GPT5 dark mode
const palette: Palette = {
  text: "#e5e7eb",
  subtext: "#9ca3af",
  surfaces: "#2a2b32",
  series: [
    "#10A37F",
    "#7AA2F7",
    "#FF7B72",
    "#F6C177",
    "#C4B5FD",
    "#F472B6",
    "#93C5FD",
    "#FACC15"
  ]
};

export default function useThemePalette(): Palette {
  return palette;
}
