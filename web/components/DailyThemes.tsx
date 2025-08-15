import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { getDailyThemes } from "@/lib/api";

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
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!refreshKey) {
      setLoading(false);
      return;
    }
    setError(null);
    setProgress(null);
    setDays([]);
    setLoading(true);
    getDailyThemes((current, total) => setProgress({ current, total }))
      .then((d) => {
        setDays(d || []);
        setProgress(null);
      })
      .catch((err) => {
        console.error("Failed to load daily themes", err);
        setError(err.message);
        setProgress(null);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (error) return <div className="text-red-400">{error}</div>;
  if (progress)
    return (
      <div className="text-gray-400">
        Analyzing {progress.current}/{progress.total} segments...
      </div>
    );
  if (loading) return <div className="text-gray-300">Loading daily themes...</div>;
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

