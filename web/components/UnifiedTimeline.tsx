import { useMemo, useRef, useEffect } from "react";
import Chart from "@/components/Chart";
import useThemePalette from "@/lib/useThemePalette";
import { useDateRange } from "@/lib/DateRangeContext";

interface MessagePoint { day: string; sender: string; messages: number; }

interface Props {
  messages: MessagePoint[];
}

export default function UnifiedTimeline({ messages }: Props) {
  const palette = useThemePalette();
  const { start: startDate, end: endDate, setRange } = useDateRange();
  const zoomTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (zoomTimeout.current) clearTimeout(zoomTimeout.current);
    };
  }, []);

  const days = useMemo(() => {
    return Array.from(new Set(messages.map(r => r.day))).sort();
  }, [messages]);

  const senders = useMemo(() => {
    return Array.from(new Set(messages.map(r => r.sender)));
  }, [messages]);

  const dataMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    messages.forEach(r => {
      if (!map[r.day]) map[r.day] = {};
      map[r.day][r.sender] = r.messages;
    });
    return map;
  }, [messages]);

  const series = senders.map((s, i) => ({
    name: s,
    type: "line",
    smooth: true,
    lineStyle: { width: 2 },
    itemStyle: { color: palette.series[i % palette.series.length] },
    data: days.map(d => (dataMap[d] && dataMap[d][s]) || 0),
  }));

  const startIdx = startDate ? days.indexOf(startDate) : 0;
  const endIdx = endDate ? days.indexOf(endDate) : days.length - 1;
  const len = Math.max(1, days.length - 1);
  const startPercent = startIdx >= 0 ? (startIdx / len) * 100 : 0;
  const endPercent = endIdx >= 0 ? (endIdx / len) * 100 : 100;

  const option = {
    backgroundColor: "transparent",
    textStyle: { color: palette.text },
    tooltip: {
      trigger: "axis",
      valueFormatter: (v: number) => v.toLocaleString(),
    },
    legend: { data: senders, textStyle: { color: palette.text } },
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
    series,
  };

  const handleZoom = (e: any) => {
    const dz = Array.isArray(e.batch) && e.batch.length ? e.batch[0] : e;
    if (dz.start == null || dz.end == null) return;
    const sIdx = Math.round((dz.start / 100) * len);
    const eIdx = Math.round((dz.end / 100) * len);
    const s = days[Math.min(len, Math.max(0, sIdx))];
    const eVal = days[Math.min(len, Math.max(0, eIdx))];
    if (zoomTimeout.current) clearTimeout(zoomTimeout.current);
    zoomTimeout.current = setTimeout(() => setRange(s, eVal), 150);
  };

  return <Chart option={option} height={300} onEvents={{ datazoom: handleZoom }} />;
}

