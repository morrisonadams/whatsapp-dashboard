import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { API_BASE } from "@/lib/api";

interface DayTheme {
  date: string;
  summary?: string;
  mood?: number;
  mood_pct?: number;
  color_hex: string;
  dominant_theme?: { id: number; name: string; icon: string };
}

interface DailyThemesProps {
  /**
   * When this value changes the component will refetch data.
   * Useful for triggering reloads after a new chat upload.
   */
  refreshKey?: string | number;
}

export default function DailyThemes({ refreshKey }: DailyThemesProps) {
  const [days, setDays] = useState<DayTheme[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch(`${API_BASE}/daily_themes`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load daily themes");
        return res.json();
      })
      .then((data) => setDays(data.days || []))
      .catch((err) => setError(err.message));
  }, [refreshKey]);

  if (error) return <div className="text-red-400">{error}</div>;
  if (!days.length) return <div className="text-gray-300">No daily themes yet.</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {days.map((day) => (
        <Card key={day.date} title={day.date}>
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">{day.dominant_theme?.icon}</span>
            <span className="flex-1">{day.summary || day.dominant_theme?.name}</span>
            <span>{(day.mood_pct ?? day.mood ?? 0).toString()}%</span>
          </div>
          <div className="h-2 w-full rounded" style={{ backgroundColor: day.color_hex }} />
        </Card>
      ))}
    </div>
  );
}

