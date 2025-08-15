import { useMemo } from "react";
import Chart from "@/components/Chart";
import Card from "@/components/Card";
import useThemePalette from "@/lib/useThemePalette";
import { useDateRange } from "@/lib/DateRangeContext";

interface WpmRecord {
  day: string;
  sender: string;
  words: number;
}

export default function WordsPerMessageBar({ data }: { data: WpmRecord[] }) {
  const palette = useThemePalette();
  const { start, end } = useDateRange();

  const summary = useMemo(() => {
    const inRange = (day: string) => {
      if (start && day < start) return false;
      if (end && day > end) return false;
      return true;
    };
    const map: Record<string, { total: number; count: number }> = {};
    data.forEach((r) => {
      if (!inRange(r.day)) return;
      if (!map[r.sender]) map[r.sender] = { total: 0, count: 0 };
      map[r.sender].total += r.words;
      map[r.sender].count += 1;
    });
    return Object.keys(map).map((sender) => ({
      sender,
      avg: map[sender].count ? map[sender].total / map[sender].count : 0,
    }));
  }, [data, start, end]);

  const option = {
    backgroundColor: "transparent",
    textStyle: { color: palette.text },
    tooltip: {
      formatter: (p: any) => `${p.name}: ${p.value.toFixed(2)} words/msg`,
    },
    xAxis: {
      type: "category",
      data: summary.map((s) => s.sender),
      axisLabel: { color: palette.text },
      axisLine: { lineStyle: { color: palette.subtext } },
    },
    yAxis: {
      type: "value",
      name: "Words/msg",
      axisLabel: { color: palette.text },
      axisLine: { lineStyle: { color: palette.subtext } },
    },
    series: [
      {
        type: "bar",
        data: summary.map((s, i) => ({
          value: s.avg,
          name: s.sender,
          itemStyle: { color: palette.series[i % palette.series.length] },
        })),
      },
    ],
  };

  return (
    <Card title="Average words per message">
      <Chart option={option} height={260} />
    </Card>
  );
}

