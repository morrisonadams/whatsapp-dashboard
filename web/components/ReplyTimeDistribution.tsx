import { useMemo } from "react";
import Chart from "@/components/Chart";
import useThemePalette from "@/lib/useThemePalette";

interface ReplyRecord {
  to: string;
  sec: number;
  day?: string; // YYYY-MM-DD
}

interface Props {
  data: ReplyRecord[];
  startDate?: string;
  endDate?: string;
  height?: number;
}

function formatDuration(s: number): string {
  if (s >= 3600) return `${(s / 3600).toFixed(1)} hr`;
  if (s >= 60) return `${(s / 60).toFixed(1)} min`;
  if (s >= 1) return `${s.toFixed(0)} s`;
  return `${(s * 1000).toFixed(0)} ms`;
}

export default function ReplyTimeDistribution({ data, startDate, endDate, height = 260 }: Props) {
  const palette = useThemePalette();

  const filtered = useMemo(() => {
    return data.filter(r => {
      if (startDate && r.day && r.day < startDate) return false;
      if (endDate && r.day && r.day > endDate) return false;
      return true;
    });
  }, [data, startDate, endDate]);

  const participants = useMemo(() => Array.from(new Set(filtered.map(r => r.to))).sort(), [filtered]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    participants.forEach((p, i) => {
      map[p] = palette.series[i % palette.series.length];
    });
    return map;
  }, [participants, palette]);

  const stats = useMemo(() => {
    const q = (arr: number[], p: number) => {
      const pos = (arr.length - 1) * p;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (arr[base + 1] !== undefined) {
        return arr[base] + rest * (arr[base + 1] - arr[base]);
      }
      return arr[base];
    };

    return participants.map(p => {
      const arr = filtered.filter(r => r.to === p).map(r => r.sec).sort((a, b) => a - b);
      if (arr.length === 0) {
        return { person: p, value: [0, 0, 0, 0, 0], median: 0, iqr: 0 };
      }
      const q1 = q(arr, 0.25);
      const median = q(arr, 0.5);
      const q3 = q(arr, 0.75);
      const min = arr[0];
      const max = arr[arr.length - 1];
      return { person: p, value: [min, q1, median, q3, max], median, iqr: q3 - q1 };
    }).filter(s => s.value[4] > 0);
  }, [filtered, participants]);

  const option = useMemo(() => ({
    backgroundColor: "transparent",
    textStyle: { color: palette.text },
    tooltip: {
      trigger: "item",
      formatter: (param: any) => {
        const st = stats[param.dataIndex];
        return `${st.person}<br/>Median: ${formatDuration(st.median)}<br/>IQR: ${formatDuration(st.iqr)}`;
      }
    },
    xAxis: {
      type: "category",
      data: stats.map(s => s.person),
      axisLabel: { color: palette.text },
      axisLine: { lineStyle: { color: palette.subtext } }
    },
    yAxis: {
      type: "value",
      name: "Reply time",
      axisLabel: { color: palette.text, formatter: (v: number) => formatDuration(v) },
      axisLine: { lineStyle: { color: palette.subtext } }
    },
    series: [
      {
        type: "boxplot",
        data: stats.map(s => ({ value: s.value, itemStyle: { color: colorMap[s.person] } })),
      }
    ]
  }), [stats, colorMap, palette]);

  if (!stats.length) {
    return <div className="text-sm text-gray-400">No reply time data.</div>;
  }

  return <Chart option={option} height={height} />;
}

