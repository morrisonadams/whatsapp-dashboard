import { useMemo, useState } from "react";
import Chart from "@/components/Chart";
import Card from "@/components/Card";
import useThemePalette from "@/lib/useThemePalette";
import { useDateRange } from "@/lib/DateRangeContext";

interface HeatPoint {
  weekday: number; // 0=Mon
  hour: number;
  count: number;
  sender: string;
}

interface Props {
  data: HeatPoint[];
  participants: string[];
}

export default function DailyRhythmHeatmap({ data, participants }: Props) {
  const palette = useThemePalette();
  const _range = useDateRange();
  const [person, setPerson] = useState<string>("All");

  const filtered = useMemo(() => {
    return data.filter(d => person === "All" || d.sender === person);
  }, [data, person]);

  const hours = Array.from({ length: 24 }).map((_, i) => i);
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const mat = Array.from({ length: 7 }, () => Array(24).fill(0));
  filtered.forEach(r => { mat[r.weekday][r.hour] += r.count; });
  const chartData: any[] = [];
  for (let w = 0; w < 7; w++) for (let h = 0; h < 24; h++) chartData.push([h, w, mat[w][h]]);
  const vmax = Math.max(1, ...chartData.map(d => d[2]));

  const option = {
    backgroundColor: "transparent",
    textStyle: { color: palette.text },
    tooltip: { valueFormatter: (v: number) => v.toLocaleString() },
    xAxis: { type: "category", data: hours, axisLabel: { color: palette.text }, axisLine: { lineStyle: { color: palette.subtext } } },
    yAxis: { type: "category", data: weekdays, axisLabel: { color: palette.text }, axisLine: { lineStyle: { color: palette.subtext } } },
    visualMap: { min: 0, max: vmax, calculable: true, orient: "horizontal", left: "center", textStyle: { color: palette.text }, inRange: { color: [palette.series[0], palette.series[1], palette.series[5]] } },
    series: [{ type: "heatmap", data: chartData, label: { show: false } }]
  };

  return (
    <Card title="Daily rhythm heatmap (weekday × hour)">
      <div className="flex gap-2 mb-2">
        <button onClick={() => setPerson("All")} className={`px-3 py-1 rounded-full ${person === "All" ? "bg-white/20" : "bg-white/10"}`}>All</button>
        {participants.map(p => (
          <button key={p} onClick={() => setPerson(p)} className={`px-3 py-1 rounded-full ${person === p ? "bg-white/20" : "bg-white/10"}`}>{p}</button>
        ))}
      </div>
      <Chart option={option} height={360} />
    </Card>
  );
}

