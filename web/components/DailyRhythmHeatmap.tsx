import { useMemo, useState } from "react";
import Chart from "@/components/Chart";
import Card from "@/components/Card";
import useThemePalette from "@/lib/useThemePalette";

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
    xAxis: {
      type: "category",
      data: hours,
      position: "top",
      axisLabel: { color: palette.text },
      axisLine: { lineStyle: { color: palette.subtext } }
    },
    yAxis: {
      type: "category",
      data: weekdays,
      axisLabel: { color: palette.text },
      axisLine: { lineStyle: { color: palette.subtext } }
    },
    visualMap: {
      min: 0,
      max: vmax,
      orient: "horizontal",
      left: "center",
      textStyle: { color: palette.text },
      inRange: { color: [palette.series[0]], colorAlpha: [0, 1] }
    },
    series: [
      {
        type: "custom",
        silent: true,
        data: [[5], [6]],
        renderItem: (params: any, api: any) => {
          const y = api.value(0);
          const start = api.coord([0, y]);
          const end = api.coord([24, y + 1]);
          return {
            type: "rect",
            shape: {
              x: start[0],
              y: start[1],
              width: end[0] - start[0],
              height: end[1] - start[1]
            },
            style: { fill: palette.text, opacity: 0.05 }
          };
        }
      },
      { type: "heatmap", data: chartData, label: { show: false }, z: 1 }
    ]
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

