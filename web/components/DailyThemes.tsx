import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import Chart from "@/components/Chart";
import useThemePalette from "@/lib/useThemePalette";
import { getDailyThemes } from "@/lib/api";

interface DayTheme {
  date: string;
  description?: string;
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
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const palette = useThemePalette();

  const parseDay = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

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
        if ((d || []).length) {
          const last = parseDay(
            (d as DayTheme[])[(d as DayTheme[]).length - 1].date
          );
          setCurrentMonth(new Date(last.getFullYear(), last.getMonth(), 1));
        }
        setProgress(null);
      })
      .catch((err) => {
        console.error("Failed to load daily themes", err);
        setError(err.message);
        setProgress(null);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const monthDays = useMemo(() => {
    if (!currentMonth) return new Map<number, DayTheme>();
    const map = new Map<number, DayTheme>();
    days.forEach((d) => {
      const dt = parseDay(d.date);
      if (
        dt.getFullYear() === currentMonth.getFullYear() &&
        dt.getMonth() === currentMonth.getMonth()
      ) {
        map.set(dt.getDate(), d);
      }
    });
    return map;
  }, [days, currentMonth]);

  const changeMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      if (!prev) return prev;
      return new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") changeMonth(-1);
      else if (e.key === "ArrowRight") changeMonth(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const scoreHistOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: {
        formatter: (p: any) => `${p.name}: ${p.value}`,
      },
      xAxis: {
        type: "category",
        data: days.map((d) => d.date),
        axisLabel: { color: palette.text, rotate: 45 },
        axisLine: { lineStyle: { color: palette.subtext } },
      },
      yAxis: {
        type: "value",
        name: "Score",
        max: 100,
        axisLabel: { color: palette.text },
        axisLine: { lineStyle: { color: palette.subtext } },
      },
      series: [
        {
          type: "bar",
          data: days.map((d) => ({
            value: d.mood_pct ?? 0,
            itemStyle: { color: d.color_hex || palette.series[0] },
          })),
        },
      ],
    }),
    [days, palette]
  );

  if (error) return <div className="text-red-400">{error}</div>;
  if (progress)
    return (
      <div className="text-gray-400">
        Analyzing {progress.current}/{progress.total} segments...
      </div>
    );
  if (loading) return <div className="text-gray-300">Loading daily themes...</div>;
  if (!days.length) return <div className="text-gray-300">No daily themes yet.</div>;

  const monthLabel = currentMonth?.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const startWeekday = currentMonth ? currentMonth.getDay() : 0; // 0=Sun
  const daysInMonth = currentMonth
    ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    : 0;
  const cells: JSX.Element[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(<div key={`b${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const info = monthDays.get(d);
    cells.push(
      <div
        key={d}
        className="relative h-16 rounded-md flex flex-col bg-white/5"
        style={info ? { backgroundColor: info.color_hex } : undefined}
      >
        <span
          className="text-xs font-bold absolute top-1 left-1 bg-white/80 text-black rounded px-1"
        >
          {d}
        </span>
        {info && (
          <span
            className="flex-1 flex items-center justify-center text-xl"
            title={[
              info.description,
              info.mood_pct !== undefined ? `Score: ${info.mood_pct}` : undefined,
            ]
              .filter(Boolean)
              .join(" — ")}
          >
            {info.dominant_theme?.icon}
          </span>
        )}
      </div>
    );
  }
  while (cells.length % 7 !== 0) cells.push(<div key={`e${cells.length}`} />);

  return (
    <Card title="Daily themes calendar" tooltip="Use the arrows to change month">
      <div className="flex items-center justify-center mb-2 font-semibold gap-2">
        <button
          onClick={() => changeMonth(-1)}
          className="px-1 rounded hover:bg-white/10"
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="flex-1 text-center">{monthLabel}</div>
        <button
          onClick={() => changeMonth(1)}
          className="px-1 rounded hover:bg-white/10"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 text-xs mb-1">
        {weekdayLabels.map((w) => (
          <div key={w} className="text-center">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
      <div className="mt-4">
        <Chart option={scoreHistOption} height={200} />
      </div>
    </Card>
  );
}

