export interface KeycapTheme {
  bg: string;
  text: string;
  subtext: string;
  surfaces: string;
  main: string;
  series: string[];
  source: string;
}

export const KEYCAP_THEMES: Record<string, KeycapTheme> = {
  "Olivia": { bg: "#F2D4CF", text: "#2E2A2B", subtext: "#C48E86", surfaces: "#BFB6B0", main: "#A56E63", series: ["#F2D4CF", "#2E2A2B", "#C48E86", "#BFB6B0", "#A56E63"], source: "Geekhack GMK Olivia / Olivia++" },
  "Nautilus": { bg: "#0C1C2B", text: "#0B5D7A", subtext: "#F1C40F", surfaces: "#1A3850", main: "#0E2A44", series: ["#0C1C2B", "#0B5D7A", "#F1C40F", "#1A3850", "#0E2A44"], source: "Geekhack GMK Nautilus" },
  "Nautilus Nightmares": { bg: "#1B143E", text: "#2B1D65", subtext: "#23D5AB", surfaces: "#C72C41", main: "#FDE74C", series: ["#1B143E", "#2B1D65", "#23D5AB", "#C72C41", "#FDE74C"], source: "Geekhack GMK Nautilus Nightmares" },
  "Olive": { bg: "#67745B", text: "#2B2F27", subtext: "#C9C8BD", surfaces: "#A7B08A", main: "#4B5640", series: ["#67745B", "#2B2F27", "#C9C8BD", "#A7B08A", "#4B5640"], source: "Geekhack GMK Olive" },
  "8008": { bg: "#2B2B2B", text: "#F2C6CF", subtext: "#889096", surfaces: "#A1ABB2", main: "#3B3E43", series: ["#2B2B2B", "#F2C6CF", "#889096", "#A1ABB2", "#3B3E43"], source: "Geekhack GMK 8008" },
  "Analog Dreams": { bg: "#2E004F", text: "#FFD1DC", subtext: "#AEE1F9", surfaces: "#F9F871", main: "#B39BC8", series: ["#2E004F", "#FFD1DC", "#AEE1F9", "#F9F871", "#B39BC8"], source: "Geekhack GMK Analog Dreams 2" },
  "Digital Nightmares": { bg: "#2E004F", text: "#5C24A5", subtext: "#00E5FF", surfaces: "#FF2E63", main: "#FCEADE", series: ["#2E004F", "#5C24A5", "#00E5FF", "#FF2E63", "#FCEADE"], source: "Geekhack GMK Analog Dreams 2 sister colorway" },
  "Dracula": { bg: "#1B1E28", text: "#282A36", subtext: "#BD93F9", surfaces: "#50FA7B", main: "#FF79C6", series: ["#1B1E28", "#282A36", "#BD93F9", "#50FA7B", "#FF79C6"], source: "Community Dracula-theme prevalence on GH" },
  "Bento": { bg: "#2A2D34", text: "#E06C75", subtext: "#98C379", surfaces: "#56B6C2", main: "#E5C07B", series: ["#2A2D34", "#E06C75", "#98C379", "#56B6C2", "#E5C07B"], source: "Geekhack Bento/Obento discussions" },
  "Metropolis": { bg: "#0B1E2D", text: "#1A3A4A", subtext: "#F4C430", surfaces: "#E74C3C", main: "#2ECC71", series: ["#0B1E2D", "#1A3A4A", "#F4C430", "#E74C3C", "#2ECC71"], source: "Metropolis style on GH" },
  "Oblivion": { bg: "#2F343F", text: "#7C7F8A", subtext: "#A6A9B6", surfaces: "#00C896", main: "#FF3B30", series: ["#2F343F", "#7C7F8A", "#A6A9B6", "#00C896", "#FF3B30"], source: "Oblivion thread heritage on GH" },
  "Botanical": { bg: "#D9E6DC", text: "#9CB7AA", subtext: "#6F8C7B", surfaces: "#3E5B4F", main: "#2A3E36", series: ["#D9E6DC", "#9CB7AA", "#6F8C7B", "#3E5B4F", "#2A3E36"], source: "Botanical-style greens on GH" },
  "Red Samurai": { bg: "#7A0C0C", text: "#D32F2F", subtext: "#FBC02D", surfaces: "#2C2C2C", main: "#8D6E63", series: ["#7A0C0C", "#D32F2F", "#FBC02D", "#2C2C2C", "#8D6E63"], source: "Geekhack Red Samurai" },
  "Blue Samurai": { bg: "#0E2A44", text: "#315A89", subtext: "#FBC02D", surfaces: "#2C2C2C", main: "#B0BEC5", series: ["#0E2A44", "#315A89", "#FBC02D", "#2C2C2C", "#B0BEC5"], source: "Geekhack Blue Samurai" },
  "Hyperfuse": { bg: "#3A3F44", text: "#99E2D0", subtext: "#77C9D4", surfaces: "#B4B7BA", main: "#2C2F33", series: ["#3A3F44", "#99E2D0", "#77C9D4", "#B4B7BA", "#2C2F33"], source: "Geekhack Hyperfuse lineage" },
  "Carbon": { bg: "#2B2B2B", text: "#FF6F00", subtext: "#9E9E9E", surfaces: "#BDBDBD", main: "#424242", series: ["#2B2B2B", "#FF6F00", "#9E9E9E", "#BDBDBD", "#424242"], source: "Geekhack SA Carbon" },
  "Chocolatier": { bg: "#4A2C2A", text: "#7B3F3F", subtext: "#C69C6D", surfaces: "#E0C9A6", main: "#2E1D19", series: ["#4A2C2A", "#7B3F3F", "#C69C6D", "#E0C9A6", "#2E1D19"], source: "Geekhack SA Chocolatier" },
  "Camping": { bg: "#2E3D30", text: "#4F6F52", subtext: "#A0B084", surfaces: "#CFD7B4", main: "#7B8C68", series: ["#2E3D30", "#4F6F52", "#A0B084", "#CFD7B4", "#7B8C68"], source: "Geekhack Camping" },
  "Muted": { bg: "#EDEDED", text: "#C9C9C9", subtext: "#9A9A9A", surfaces: "#6C6C6C", main: "#3D3D3D", series: ["#EDEDED", "#C9C9C9", "#9A9A9A", "#6C6C6C", "#3D3D3D"], source: "Geekhack GMK Muted" },
  "Cafe": { bg: "#3B2F2F", text: "#6F4E37", subtext: "#C0A080", surfaces: "#E8D5C4", main: "#8D6E63", series: ["#3B2F2F", "#6F4E37", "#C0A080", "#E8D5C4", "#8D6E63"], source: "Geekhack GMK Cafe" },
  "Modern Dolch": { bg: "#2F3136", text: "#5C5F66", subtext: "#B1B5BD", surfaces: "#D8DBE1", main: "#1F2227", series: ["#2F3136", "#5C5F66", "#B1B5BD", "#D8DBE1", "#1F2227"], source: "Geekhack Modern Dolch" },
  "Mizu": { bg: "#B3E5FC", text: "#81D4FA", subtext: "#4FC3F7", surfaces: "#0288D1", main: "#01579B", series: ["#B3E5FC", "#81D4FA", "#4FC3F7", "#0288D1", "#01579B"], source: "Geekhack GMK Mizu" },
  "Shoko": { bg: "#F2F6FB", text: "#C6DBF7", subtext: "#9FBCE6", surfaces: "#6A8FC9", main: "#3C5E99", series: ["#F2F6FB", "#C6DBF7", "#9FBCE6", "#6A8FC9", "#3C5E99"], source: "Shoko on GH" },
  "Yuri": { bg: "#0E1A2B", text: "#1F3A93", subtext: "#E1E1E1", surfaces: "#C0392B", main: "#95A5A6", series: ["#0E1A2B", "#1F3A93", "#E1E1E1", "#C0392B", "#95A5A6"], source: "Geekhack GMK Yuri" },
  "Laser": { bg: "#1A0033", text: "#0F0F7A", subtext: "#FF2E88", surfaces: "#00F0FF", main: "#8A2BE2", series: ["#1A0033", "#0F0F7A", "#FF2E88", "#00F0FF", "#8A2BE2"], source: "MiTo Laser on GH" },
  "Miami Nights": { bg: "#1C1F2B", text: "#00F0FF", subtext: "#FF2E88", surfaces: "#2B2E3B", main: "#8A2BE2", series: ["#1C1F2B", "#00F0FF", "#FF2E88", "#2B2E3B", "#8A2BE2"], source: "Geekhack Miami Nights Reloaded" },
  "Metaverse": { bg: "#101010", text: "#FF0033", subtext: "#FFFFFF", surfaces: "#1A1A1A", main: "#E0E0E0", series: ["#101010", "#FF0033", "#FFFFFF", "#1A1A1A", "#E0E0E0"], source: "Community" },
  "Hennessey": { bg: "#FFFFFF", text: "#000000", subtext: "#CCCCCC", surfaces: "#1A1A1A", main: "#4D4D4D", series: ["#FFFFFF", "#000000", "#CCCCCC", "#1A1A1A", "#4D4D4D"], source: "Geekhack GMK Hennessey-like BoW/WoB" },
  "Minimal": { bg: "#FFFFFF", text: "#F2F2F2", subtext: "#C9C9C9", surfaces: "#8C8C8C", main: "#1A1A1A", series: ["#FFFFFF", "#F2F2F2", "#C9C9C9", "#8C8C8C", "#1A1A1A"], source: "Geekhack Minimal" },
  "Dualshot": { bg: "#1D1D1D", text: "#2F2F2F", subtext: "#00A3FF", surfaces: "#FF0040", main: "#A1A1A1", series: ["#1D1D1D", "#2F2F2F", "#00A3FF", "#FF0040", "#A1A1A1"], source: "Dualshot vibe on GH" },
  "Plum": { bg: "#2B1B2D", text: "#5E2750", subtext: "#9B4D96", surfaces: "#D7B0E8", main: "#F2E5F7", series: ["#2B1B2D", "#5E2750", "#9B4D96", "#D7B0E8", "#F2E5F7"], source: "HHKB Plum-inspired" },
  "Burgundy": { bg: "#3A0D12", text: "#6D1A21", subtext: "#A52A2A", surfaces: "#D4A373", main: "#E9D8A6", series: ["#3A0D12", "#6D1A21", "#A52A2A", "#D4A373", "#E9D8A6"], source: "Classic burgundy sets on GH" },
  "Noel": { bg: "#E8F7FF", text: "#A7D0F2", subtext: "#FBCDEB", surfaces: "#FEE9A8", main: "#6A8FC9", series: ["#E8F7FF", "#A7D0F2", "#FBCDEB", "#FEE9A8", "#6A8FC9"], source: "Geekhack Noel" },
  "Frost Witch": { bg: "#E8F1FF", text: "#A6C8FF", subtext: "#7BA7F7", surfaces: "#4D6BD8", main: "#2F3B70", series: ["#E8F1FF", "#A6C8FF", "#7BA7F7", "#4D6BD8", "#2F3B70"], source: "Geekhack Frost Witch" },
  "Jamon": { bg: "#3B0F0F", text: "#700D0D", subtext: "#A30D0D", surfaces: "#D94E4E", main: "#F2B6A0", series: ["#3B0F0F", "#700D0D", "#A30D0D", "#D94E4E", "#F2B6A0"], source: "Geekhack GMK Jamon" },
  "Terra": { bg: "#54412F", text: "#7A5C3A", subtext: "#A77F58", surfaces: "#D1BFA3", main: "#8C6D52", series: ["#54412F", "#7A5C3A", "#A77F58", "#D1BFA3", "#8C6D52"], source: "Terra-like brown/earthy" },
  "Taro": { bg: "#EAE0FF", text: "#C9B8FF", subtext: "#A695FF", surfaces: "#7E6AFF", main: "#5741C6", series: ["#EAE0FF", "#C9B8FF", "#A695FF", "#7E6AFF", "#5741C6"], source: "Geekhack GMK Taro" },
  "Bingsu": { bg: "#2B2E4A", text: "#903749", subtext: "#E84545", surfaces: "#53354A", main: "#E8E8E8", series: ["#2B2E4A", "#903749", "#E84545", "#53354A", "#E8E8E8"], source: "DSA Bingsu vibe" },
  "Sandstorm": { bg: "#D9CAB3", text: "#C1A57B", subtext: "#A9825E", surfaces: "#6B4E3B", main: "#3E2C1C", series: ["#D9CAB3", "#C1A57B", "#A9825E", "#6B4E3B", "#3E2C1C"], source: "SA Sandstorm-esque" },
  "Olivia Dark": { bg: "#1F1B1C", text: "#C39A92", subtext: "#A86D64", surfaces: "#8F6A67", main: "#3A3334", series: ["#1F1B1C", "#C39A92", "#A86D64", "#8F6A67", "#3A3334"], source: "Olivia++ dark kits" },
  "Olivia Light": { bg: "#F7E6E2", text: "#D7B8B2", subtext: "#AC8C85", surfaces: "#6D5B5A", main: "#2E2A2B", series: ["#F7E6E2", "#D7B8B2", "#AC8C85", "#6D5B5A", "#2E2A2B"], source: "Olivia light kits" },
  "Olivia Rose Gold (alt)": { bg: "#2E2A2B", text: "#E5B6A9", subtext: "#C48E86", surfaces: "#F4DFD9", main: "#8A6E68", series: ["#2E2A2B", "#E5B6A9", "#C48E86", "#F4DFD9", "#8A6E68"], source: "Olivia alt accents" },
  "Nerve": { bg: "#111111", text: "#1F1F1F", subtext: "#00FF66", surfaces: "#FF0066", main: "#BFBFBF", series: ["#111111", "#1F1F1F", "#00FF66", "#FF0066", "#BFBFBF"], source: "Geekhack GMK NERVE" },
  "Delta": { bg: "#2C2F33", text: "#7289DA", subtext: "#99AAB5", surfaces: "#1ABC9C", main: "#2ECC71", series: ["#2C2F33", "#7289DA", "#99AAB5", "#1ABC9C", "#2ECC71"], source: "GMK Delta R2 IC" },
  "Just Beachy": { bg: "#F7EDD1", text: "#F5CBA7", subtext: "#6EC1E4", surfaces: "#2A9D8F", main: "#264653", series: ["#F7EDD1", "#F5CBA7", "#6EC1E4", "#2A9D8F", "#264653"], source: "GMK Just Beachy IC" },
  "Orenji": { bg: "#1C1C1C", text: "#FF7F11", subtext: "#FFA552", surfaces: "#FFE5B4", main: "#373737", series: ["#1C1C1C", "#FF7F11", "#FFA552", "#FFE5B4", "#373737"], source: "GMK CYL Orenji IC" },
  "Harvest": { bg: "#3A2F1B", text: "#6B4F2A", subtext: "#A57548", surfaces: "#D9A76A", main: "#E8D8C3", series: ["#3A2F1B", "#6B4F2A", "#A57548", "#D9A76A", "#E8D8C3"], source: "GMK Harvest IC" },
  "Star": { bg: "#1D1F2A", text: "#F78FB3", subtext: "#FFD166", surfaces: "#06D6A0", main: "#118AB2", series: ["#1D1F2A", "#F78FB3", "#FFD166", "#06D6A0", "#118AB2"], source: "GMK Star IC" },
  "Redline": { bg: "#1A1A1A", text: "#2C2C2C", subtext: "#E50914", surfaces: "#FF3B30", main: "#B3B3B3", series: ["#1A1A1A", "#2C2C2C", "#E50914", "#FF3B30", "#B3B3B3"], source: "GMK Redline GB" },
  "Oblivion Mono": { bg: "#1F242C", text: "#2B3038", subtext: "#3A3F47", surfaces: "#4F5560", main: "#9DA5B4", series: ["#1F242C", "#2B3038", "#3A3F47", "#4F5560", "#9DA5B4"], source: "Oblivion Mono style" },
  "Muted Retro": { bg: "#ECE3CE", text: "#DBCCAA", subtext: "#C1B18B", surfaces: "#8C7A5E", main: "#4E4534", series: ["#ECE3CE", "#DBCCAA", "#C1B18B", "#8C7A5E", "#4E4534"], source: "Muted retro tones" },
  "Haze": { bg: "#1E1B2E", text: "#4E3D77", subtext: "#7A68B3", surfaces: "#B3A2E6", main: "#E6DEF9", series: ["#1E1B2E", "#4E3D77", "#7A68B3", "#B3A2E6", "#E6DEF9"], source: "Moody purple-ish set vibe" },
  "Pastel Sea": { bg: "#E0FFF9", text: "#B6F7E1", subtext: "#8ADDD0", surfaces: "#6CB3B8", main: "#2B6777", series: ["#E0FFF9", "#B6F7E1", "#8ADDD0", "#6CB3B8", "#2B6777"], source: "Pastel aqua GH trends" },
  "Industrial": { bg: "#2F2F2F", text: "#4A4A4A", subtext: "#7A7A7A", surfaces: "#BFBFBF", main: "#FFD166", series: ["#2F2F2F", "#4A4A4A", "#7A7A7A", "#BFBFBF", "#FFD166"], source: "Grey + hazard accent" },
  "Aurora": { bg: "#0B132B", text: "#1C2541", subtext: "#3A506B", surfaces: "#5BC0BE", main: "#C2DFE3", series: ["#0B132B", "#1C2541", "#3A506B", "#5BC0BE", "#C2DFE3"], source: "Nord/aurora vibes in GH" },
  "Nord": { bg: "#2E3440", text: "#3B4252", subtext: "#434C5E", surfaces: "#D8DEE9", main: "#88C0D0", series: ["#2E3440", "#3B4252", "#434C5E", "#D8DEE9", "#88C0D0"], source: "Nord kits discussed on GH" },
  "Iceberg": { bg: "#102A43", text: "#243B53", subtext: "#486581", surfaces: "#9FB3C8", main: "#D9E2EC", series: ["#102A43", "#243B53", "#486581", "#9FB3C8", "#D9E2EC"], source: "Ice blue tones" },
  "Sunset": { bg: "#2D1E2F", text: "#F46036", subtext: "#E0CA3C", surfaces: "#2E294E", main: "#1B998B", series: ["#2D1E2F", "#F46036", "#E0CA3C", "#2E294E", "#1B998B"], source: "Vivid sunset themes on GH" },
  "Forest": { bg: "#0B3D20", text: "#166534", subtext: "#22A45D", surfaces: "#A7DBB8", main: "#EAF7ED", series: ["#0B3D20", "#166534", "#22A45D", "#A7DBB8", "#EAF7ED"], source: "Forest green schemes" },
  "Desert": { bg: "#564138", text: "#C4A484", subtext: "#D1BFA3", surfaces: "#EDE3D1", main: "#8C6D52", series: ["#564138", "#C4A484", "#D1BFA3", "#EDE3D1", "#8C6D52"], source: "Warm sand tones" },
  "Gruvbox Dark": { bg: "#282828", text: "#3C3836", subtext: "#504945", surfaces: "#B8BB26", main: "#FABD2F", series: ["#282828", "#3C3836", "#504945", "#B8BB26", "#FABD2F"], source: "Gruvbox dark theme" },
  "Gruvbox Light": { bg: "#FBF1C7", text: "#EBDBB2", subtext: "#D5C4A1", surfaces: "#98971A", main: "#D79921", series: ["#FBF1C7", "#EBDBB2", "#D5C4A1", "#98971A", "#D79921"], source: "Gruvbox light theme" }
};

export const KEYCAP_THEME_NAMES = Object.keys(KEYCAP_THEMES);
