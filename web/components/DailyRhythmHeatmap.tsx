import { useMemo } from "react";
import Chart from "@/components/Chart";
import { Palette } from "@/lib/useThemePalette";

type HeatEntry = {
  sender: string;
  weekday: number;
  hour: number;
  count: number;
  day?: string;
};

interface Props {
  data: HeatEntry[];
  person: string;
  palette: Palette;
  days: string[];
  zoomRange: [number, number] | null;
  startDate?: string;
  endDate?: string;
}

export default function DailyRhythmHeatmap({ data, person, palette, days, zoomRange, startDate, endDate }: Props) {
  const option = useMemo(() => {
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    let filtered = data.filter((r) => (person === "All" ? true : r.sender === person));

    if (startDate || endDate) {
      filtered = filtered.filter((r) => {
        if (!r.day) return true;
        if (startDate && r.day < startDate) return false;
        if (endDate && r.day > endDate) return false;
        return true;
      });
    }

    if (zoomRange && days.length) {
      const rangeDays = days.slice(zoomRange[0], zoomRange[1] + 1);
      filtered = filtered.filter((r) => !r.day || rangeDays.includes(r.day));
    }

    const mat = Array.from({ length: 7 }, () => Array(24).fill(0));
    filtered.forEach((r) => {
      mat[r.weekday][r.hour] += r.count;
    });

    const dataArr: any[] = [];
    for (let w = 0; w < 7; w++) {
      for (let h = 0; h < 24; h++) {
        dataArr.push([h, w, mat[w][h]]);
      }
    }

    const vmax = Math.max(1, ...dataArr.map((d: any) => d[2]));
    const weekendShade = "rgba(255,255,255,0.05)";
    const splitColors = weekdays.map((_, i) => (i >= 5 ? weekendShade : "rgba(0,0,0,0)"));

    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { valueFormatter: (value: number) => value.toLocaleString() },
      grid: { left: 40, right: 20, top: 40, bottom: 60 },
      xAxis: {
        type: "category",
        data: hours,
        position: "top",
        axisLabel: { color: palette.text },
        axisLine: { lineStyle: { color: palette.subtext } },
      },
      yAxis: {
        type: "category",
        data: weekdays,
        axisLabel: { color: palette.text },
        axisLine: { lineStyle: { color: palette.subtext } },
        splitArea: { show: true, areaStyle: { color: splitColors } },
      },
      visualMap: {
        min: 0,
        max: vmax,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        textStyle: { color: palette.text },
        inRange: { color: [palette.series[0], palette.series[1], palette.series[5]] },
      },
      series: [
        {
          type: "heatmap",
          data: dataArr,
          label: { show: false },
        },
      ],
    };
  }, [data, person, palette, days, zoomRange, startDate, endDate]);

  return <Chart option={option} height={360} />;
}
