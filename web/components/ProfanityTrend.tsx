import { useMemo } from "react";
import Chart from "@/components/Chart";
import useThemePalette from "@/lib/useThemePalette";

interface TimelineProfanity {
  day: string;
  hits: number;
  sender?: string;
}

interface TimelineWords {
  day: string;
  words: number;
  sender?: string;
}

interface Props {
  profanityTimeline: TimelineProfanity[];
  wordTimeline: TimelineWords[];
  startDate?: string;
  endDate?: string;
}

function dateFilter(day: string, start?: string, end?: string) {
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

function aggregateMap<T extends { day: string }>(
  tl: T[],
  key: keyof T,
  start?: string,
  end?: string
): Record<string, number> {
  const map: Record<string, number> = {};
  tl.filter(r => dateFilter(r.day, start, end)).forEach(r => {
    const v = Number((r as any)[key]) || 0;
    map[r.day] = (map[r.day] || 0) + v;
  });
  return map;
}

function prevSum<T extends { day: string }>(
  tl: T[],
  key: keyof T,
  firstDay: string,
  len: number
): number {
  const prevEnd = new Date(firstDay);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(firstDay);
  prevStart.setDate(prevStart.getDate() - len);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const s = fmt(prevStart);
  const e = fmt(prevEnd);
  const map: Record<string, number> = {};
  tl.filter(r => r.day >= s && r.day <= e).forEach(r => {
    const v = Number((r as any)[key]) || 0;
    map[r.day] = (map[r.day] || 0) + v;
  });
  return Object.values(map).reduce((a, b) => a + b, 0);
}

export default function ProfanityTrend({
  profanityTimeline,
  wordTimeline,
  startDate,
  endDate
}: Props) {
  const palette = useThemePalette();

  const profMap = useMemo(
    () => aggregateMap(profanityTimeline, "hits", startDate, endDate),
    [profanityTimeline, startDate, endDate]
  );
  const wordMap = useMemo(
    () => aggregateMap(wordTimeline, "words", startDate, endDate),
    [wordTimeline, startDate, endDate]
  );

  const days = useMemo(
    () => Array.from(new Set([...Object.keys(profMap), ...Object.keys(wordMap)])).sort(),
    [profMap, wordMap]
  );

  const series = useMemo(
    () =>
      days.map(d => {
        const hits = profMap[d] || 0;
        const words = wordMap[d] || 0;
        return words > 0 ? hits / (words / 1000) : 0;
      }),
    [days, profMap, wordMap]
  );

  const totals = useMemo(() => {
    const totalHits = days.reduce((s, d) => s + (profMap[d] || 0), 0);
    const totalWords = days.reduce((s, d) => s + (wordMap[d] || 0), 0);
    return { totalHits, totalWords };
  }, [days, profMap, wordMap]);

  const currentRate = useMemo(
    () => (totals.totalWords > 0 ? totals.totalHits / (totals.totalWords / 1000) : 0),
    [totals]
  );

  const prevRate = useMemo(() => {
    if (!days.length) return 0;
    const hits = prevSum(profanityTimeline, "hits", days[0], days.length);
    const words = prevSum(wordTimeline, "words", days[0], days.length);
    return words > 0 ? hits / (words / 1000) : 0;
  }, [profanityTimeline, wordTimeline, days]);

  const delta = useMemo(
    () => (prevRate > 0 ? ((currentRate - prevRate) / prevRate) * 100 : 0),
    [currentRate, prevRate]
  );

  const option = useMemo(
    () => ({
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: number) => v.toFixed(2)
      },
      xAxis: {
        type: "category",
        data: days,
        axisLabel: { color: palette.text },
        axisLine: { lineStyle: { color: palette.subtext } }
      },
      yAxis: {
        type: "value",
        name: "Hits / 1k words",
        axisLabel: {
          color: palette.text,
          formatter: (v: number) => v.toFixed(1)
        },
        axisLine: { lineStyle: { color: palette.subtext } }
      },
      series: [
        {
          name: "Profanity/1k words",
          type: "line",
          data: series,
          smooth: true,
          lineStyle: { color: palette.series[0] }
        }
      ]
    }),
    [days, series, palette]
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="text-3xl font-bold">{currentRate.toFixed(2)}</div>
        <div className="text-sm text-sub">per 1k words</div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            delta >= 0
              ? "bg-green-500/20 text-green-300"
              : "bg-red-500/20 text-red-300"
          }`}
        >
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}%
        </span>
      </div>
      <Chart option={option} height={260} />
    </div>
  );
}

