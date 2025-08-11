import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import useThemePalette from "@/lib/useThemePalette";

interface ParticipantColors {
  participants: string[];
  colorMap: Record<string, string>;
  setParticipants: (p: string[]) => void;
}

const ParticipantColorsContext = createContext<ParticipantColors>({
  participants: [],
  colorMap: {},
  setParticipants: () => {}
});

export function ParticipantColorsProvider({ children }: { children: ReactNode }) {
  const palette = useThemePalette();
  const [participants, setParticipants] = useState<string[]>([]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    participants.forEach((p, i) => {
      map[p] = palette.series[i % palette.series.length];
    });
    return map;
  }, [participants, palette]);

  return (
    <ParticipantColorsContext.Provider value={{ participants, colorMap, setParticipants }}>
      {children}
    </ParticipantColorsContext.Provider>
  );
}

export function useParticipantColors() {
  return useContext(ParticipantColorsContext);
}

