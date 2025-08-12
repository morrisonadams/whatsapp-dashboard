import { useMemo } from "react";
import Chart from "@/components/Chart";
import Card from "@/components/Card";
import useThemePalette from "@/lib/useThemePalette";

interface MessagePoint {
  day: string;
  sender: string;
  messages: number;
}

interface Props {
  messages: MessagePoint[];
  participants: string[];
}

function weekKey(day: string): string {
  const d = new Date(day);
  // Adjust to Monday as start of week
  const diff = (d.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
  return monday.toISOString().slice(0, 10);
}

export default function SenderShareAreaChart({ messages, participants }: Props) {
  const palette = useThemePalette();

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    participants.forEach((p, i) => {
      map[p] = palette.series[i % palette.series.length];
    });
    return map;
  }, [participants, palette]);

  const weeks = useMemo(() => {
    const weekSet = new Set<string>();
    messages.forEach(m => weekSet.add(weekKey(m.day)));
    return Array.from(weekSet).sort();
  }, [messages]);

  const dataMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    messages.forEach(m => {
      const w = weekKey(m.day);
      if (!map[w]) map[w] = {};
      map[w][m.sender] = (map[w][m.sender] || 0) + m.messages;
    });
    return map;
  }, [messages]);

  const series = participants.map((p, i) => ({
    name: p,
    type: "line",
    stack: "share",
    areaStyle: {},
    lineStyle: { width: 1 },
    itemStyle: { color: colorMap[p] },
    data: weeks.map(w => {
      const total = participants.reduce((s, pp) => s + (dataMap[w]?.[pp] || 0), 0);
      const val = total ? ((dataMap[w]?.[p] || 0) / total) * 100 : 0;
      return Number(val.toFixed(2));
    })
  }));

  const option = {
    backgroundColor: "transparent",
    textStyle: { color: palette.text },
    tooltip: {
      trigger: "axis",
      valueFormatter: (v: number) => `${v.toFixed(1)}%`
    },
    legend: { data: participants, textStyle: { color: palette.text } },
    xAxis: {
      type: "category",
      data: weeks,
      axisLabel: { color: palette.text },
      axisLine: { lineStyle: { color: palette.subtext } }
    },
    yAxis: {
      type: "value",
      max: 100,
      axisLabel: { color: palette.text, formatter: (v: number) => `${v}%` },
      axisLine: { lineStyle: { color: palette.subtext } }
    },
    series
  };

  return (
    <Card title="Sender share over time">
      <Chart option={option} height={260} />
    </Card>
  );
}

