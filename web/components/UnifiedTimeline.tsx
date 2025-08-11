import { useMemo } from "react";
import Chart from "@/components/Chart";
import useThemePalette from "@/lib/useThemePalette";

interface MessagePoint { day: string; messages: number; }
interface WordPoint { day: string; words: number; }
interface ConflictMarker { date: string; summary?: string; }
interface AffectionPoint { day: string; affection: number; }

interface Props {
  messages: MessagePoint[];
  words: WordPoint[];
  conflicts?: ConflictMarker[];
  affection?: AffectionPoint[];
  startDate?: string;
  endDate?: string;
  onRangeChange?: (start: string, end: string) => void;
}

export default function UnifiedTimeline({
  messages,
  words,
  conflicts = [],
  affection = [],
  startDate,
  endDate,
  onRangeChange,
}: Props) {
  const palette = useThemePalette();

  const days = useMemo(() => {
    const s = new Set<string>();
    messages.forEach((r) => s.add(r.day));
    words.forEach((r) => s.add(r.day));
    return Array.from(s).sort();
  }, [messages, words]);

  const msgMap = useMemo(() => {
    const m: Record<string, number> = {};
    messages.forEach((r) => {
      m[r.day] = (m[r.day] || 0) + r.messages;
    });
    return m;
  }, [messages]);

  const wordMap = useMemo(() => {
    const m: Record<string, number> = {};
    words.forEach((r) => {
      m[r.day] = (m[r.day] || 0) + r.words;
    });
    return m;
  }, [words]);

  const msgData = days.map((d) => msgMap[d] || 0);
  const wordData = days.map((d) => wordMap[d] || 0);

  const startIdx = startDate ? days.indexOf(startDate) : 0;
  const endIdx = endDate ? days.indexOf(endDate) : days.length - 1;
  const len = Math.max(1, days.length - 1);
  const startPercent = startIdx >= 0 ? (startIdx / len) * 100 : 0;
  const endPercent = endIdx >= 0 ? (endIdx / len) * 100 : 100;

  const markerSeries: any[] = [];
  if (conflicts.length) {
    markerSeries.push({
      name: "Conflicts",
      type: "scatter",
      symbol: "triangle",
      symbolSize: 12,
      data: conflicts.map((c) => ({
        value: [c.date, (msgMap[c.date] || 0) + (wordMap[c.date] || 0)],
        date: c.date,
        summary: c.summary,
      })),
      itemStyle: { color: palette.series[2] },
      tooltip: { formatter: (p: any) => `${p.data.date}<br/>${p.data.summary || ""}` },
    });
  }
  if (affection.length) {
    const aff = affection.filter((a) => a.affection > 0);
    markerSeries.push({
      name: "Affection",
      type: "scatter",
      symbol: "circle",
      symbolSize: 10,
      data: aff.map((a) => ({
        value: [a.day, (msgMap[a.day] || 0) + (wordMap[a.day] || 0)],
        day: a.day,
        affection: a.affection,
      })),
      itemStyle: { color: palette.series[3] },
      tooltip: {
        formatter: (p: any) => `${p.data.day}<br/>Affection: ${p.data.affection}`,
      },
    });
  }

  const option = {
    backgroundColor: "transparent",
    textStyle: { color: palette.text },
    tooltip: {
      trigger: "axis",
      valueFormatter: (v: number) => v.toLocaleString(),
    },
    legend: { data: ["Messages", "Words"], textStyle: { color: palette.text } },
    xAxis: {
      type: "category",
      data: days,
      axisLabel: { color: palette.text },
      axisLine: { lineStyle: { color: palette.subtext } },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: palette.text,
        formatter: (v: number) => v.toLocaleString(),
      },
      axisLine: { lineStyle: { color: palette.subtext } },
    },
    dataZoom: [
      { type: "inside", start: startPercent, end: endPercent },
      { type: "slider", start: startPercent, end: endPercent },
    ],
    series: [
      {
        name: "Messages",
        type: "bar",
        stack: "total",
        data: msgData,
        itemStyle: { color: palette.series[0] },
      },
      {
        name: "Words",
        type: "bar",
        stack: "total",
        data: wordData,
        itemStyle: { color: palette.series[1] },
      },
      ...markerSeries,
    ],
  };

  const handleZoom = (e: any) => {
    if (!onRangeChange) return;
    const dz = Array.isArray(e.batch) && e.batch.length ? e.batch[0] : e;
    if (dz.start == null || dz.end == null) return;
    const sIdx = Math.round((dz.start / 100) * len);
    const eIdx = Math.round((dz.end / 100) * len);
    const s = days[Math.min(len, Math.max(0, sIdx))];
    const eVal = days[Math.min(len, Math.max(0, eIdx))];
    onRangeChange(s, eVal);
  };

  return <Chart option={option} height={300} onEvents={{ datazoom: handleZoom }} />;
}

