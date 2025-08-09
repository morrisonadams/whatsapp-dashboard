export interface VimTheme {
  bg: string;
  text: string;
  subtext: string;
  surfaces: string;
  main: string;
  series: string[];
}

export const VIM_THEMES: Record<string, VimTheme> = {
  gruvbox_dark: {
    bg: "#282828",
    text: "#ebdbb2",
    subtext: "#a89984",
    surfaces: "#32302f",
    main: "#fabd2f",
    series: ["#cc241d", "#98971a", "#d79921", "#458588", "#b16286", "#689d6a"],
  },
  tokyonight: {
    bg: "#1a1b26",
    text: "#c0caf5",
    subtext: "#a9b1d6",
    surfaces: "#24283b",
    main: "#7aa2f7",
    series: ["#7aa2f7", "#f7768e", "#9ece6a", "#bb9af7", "#e0af68", "#7dcfff"],
  },
  solarized_dark: {
    bg: "#002b36",
    text: "#839496",
    subtext: "#586e75",
    surfaces: "#073642",
    main: "#b58900",
    series: ["#dc322f", "#268bd2", "#2aa198", "#859900", "#cb4b16", "#6c71c4"],
  },
  dracula: {
    bg: "#282a36",
    text: "#f8f8f2",
    subtext: "#6272a4",
    surfaces: "#44475a",
    main: "#bd93f9",
    series: ["#ff79c6", "#8be9fd", "#50fa7b", "#ffb86c", "#ff5555", "#f1fa8c"],
  },
};

export const VIM_THEME_NAMES = Object.keys(VIM_THEMES);
