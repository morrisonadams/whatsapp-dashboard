import { useMemo } from "react";
import Chart from "@/components/Chart";
import Card from "@/components/Card";
import useThemePalette from "@/lib/useThemePalette";

interface Props {
  data: Record<string, number[]>; // sender -> reply times in seconds
}

function calcBox(values: number[]): [number, number, number, number, number] {
  if (!values.length) return [0, 0, 0, 0, 0];
  const v = [...values].sort((a, b) => a - b);
  const q = (p: number) => {
    const idx = (v.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return v[lo];
    return v[lo] * (hi - idx) + v[hi] * (idx - lo);
  };
  return [v[0], q(0.25), q(0.5), q(0.75), v[v.length - 1]];
}

export default function ReplyTimeDistribution({ data }: Props) {
  const palette = useThemePalette();
  const participants = useMemo(() => Object.keys(data), [data]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    participants.forEach((p, i) => {
      map[p] = palette.series[i % palette.series.length];
    });
    return map;
  }, [participants, palette]);

  const seriesData = participants.map(p => ({
    name: p,
    value: calcBox(data[p] || []),
    itemStyle: { color: colorMap[p] }
  }));

  const option = {
    backgroundColor: "transparent",
    textStyle: { color: palette.text },
    tooltip: {
      formatter: (p: any) => {
        const v = p.data.value;
        return `${p.name}<br/>Min: ${v[0]}s<br/>Q1: ${v[1]}s<br/>Median: ${v[2]}s<br/>Q3: ${v[3]}s<br/>Max: ${v[4]}s`;
      }
    },
    xAxis: {
      type: "category",
      data: participants,
      axisLabel: { color: palette.text },
      axisLine: { lineStyle: { color: palette.subtext } }
    },
    yAxis: {
      type: "value",
      name: "Seconds",
      axisLabel: { color: palette.text },
      axisLine: { lineStyle: { color: palette.subtext } }
    },
    series: [{ type: "boxplot", data: seriesData }]
  };

  return (
    <Card title="Reply time distribution">
      <Chart option={option} height={260} />
    </Card>
  );
}

