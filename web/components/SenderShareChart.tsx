import Chart from "@/components/Chart";
import useThemePalette from "@/lib/useThemePalette";

interface TimelinePoint {
  day: string;
  sender: string;
  messages?: number;
  words?: number;
}

interface Props {
  data: TimelinePoint[];
  participants: string[];
  colorMap: Record<string, string>;
  zoomRange: [number, number] | null;
}

export default function SenderShareChart({ data, participants, colorMap, zoomRange }: Props) {
  const palette = useThemePalette();

  const allDays = Array.from(new Set(data.map(r => r.day))).sort();
  let startIdx = zoomRange ? zoomRange[0] : 0;
  let endIdx = zoomRange ? zoomRange[1] : allDays.length - 1;
  startIdx = Math.max(0, Math.min(startIdx, allDays.length - 1));
  endIdx = Math.max(0, Math.min(endIdx, allDays.length - 1));
  if (endIdx < startIdx) endIdx = startIdx;
  const visibleDays = allDays.slice(startIdx, endIdx + 1);

  const getWeekStart = (dStr: string) => {
    const d = new Date(dStr + "T00:00:00Z");
    const day = d.getUTCDay();
    const diff = (day + 6) % 7; // Monday start
    d.setUTCDate(d.getUTCDate() - diff);
    return d.toISOString().slice(0, 10);
  };

  const weekMap: Record<string, Record<string, number>> = {};
  data
    .filter(r => visibleDays.includes(r.day))
    .forEach(r => {
      const week = getWeekStart(r.day);
      if (!weekMap[week]) weekMap[week] = {};
      const val = (r.messages ?? r.words) || 0;
      weekMap[week][r.sender] = (weekMap[week][r.sender] || 0) + val;
    });

  const weeks = Object.keys(weekMap).sort();
  const totals = weeks.map(w =>
    participants.reduce((sum, p) => sum + (weekMap[w][p] || 0), 0)
  );

  const series = participants.map(p => ({
    name: p,
    type: "line",
    stack: "total",
    areaStyle: { opacity: 0.8 },
    lineStyle: { width: 0 },
    symbol: "none",
    itemStyle: { color: colorMap[p] },
    data: weeks.map((w, i) => {
      const val = weekMap[w][p] || 0;
      const total = totals[i] || 1;
      return (val / total) * 100;
    })
  }));

  const option = {
    backgroundColor: "transparent",
    textStyle: { color: palette.text },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (value: number) => `${value.toFixed(1)}%`
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

  return <Chart option={option} height={260} />;
}
