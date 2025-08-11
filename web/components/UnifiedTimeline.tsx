import { useMemo } from "react";
import Chart from "@/components/Chart";
import useThemePalette from "@/lib/useThemePalette";
import { useDateRange } from "@/lib/DateRangeContext";

interface TimelineEntry {
  day: string;
  messages?: number;
  words?: number;
}

interface UnifiedTimelineProps {
  timelineMessages: TimelineEntry[];
  timelineWords: TimelineEntry[];
  conflictDates?: string[];
  affectionDates?: string[];
}

function movingAvg(arr: number[], window = 7): number[] {
  const res: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = arr.slice(start, i + 1);
    const avg = slice.reduce((s, v) => s + v, 0) / slice.length;
    res.push(avg);
  }
  return res;
}

export default function UnifiedTimeline({
  timelineMessages,
  timelineWords,
  conflictDates = [],
  affectionDates = [],
}: UnifiedTimelineProps) {
  const palette = useThemePalette();
  const { setStartDate, setEndDate } = useDateRange();

  const data = useMemo(() => {
    const msgMap: Record<string, number> = {};
    const wordMap: Record<string, number> = {};
    timelineMessages.forEach(r => {
      msgMap[r.day] = (msgMap[r.day] || 0) + (r.messages || 0);
    });
    timelineWords.forEach(r => {
      wordMap[r.day] = (wordMap[r.day] || 0) + (r.words || 0);
    });
    const days = Array.from(new Set([...Object.keys(msgMap), ...Object.keys(wordMap)])).sort();
    const msgSeries = days.map(d => msgMap[d] || 0);
    const wordSeries = days.map(d => wordMap[d] || 0);
    return {
      days,
      msgSeries,
      wordSeries,
      maMsg: movingAvg(msgSeries),
      maWord: movingAvg(wordSeries),
    };
  }, [timelineMessages, timelineWords]);

  const option = useMemo(() => {
    const conflicts = conflictDates.map(d => ({ value: [d, 0] }));
    const affection = affectionDates.map(d => ({ value: [d, 0] }));
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { trigger: "axis" },
      legend: {
        data: [
          "Messages",
          "Words",
          "7d avg messages",
          "7d avg words",
          ...(conflicts.length ? ["Conflicts"] : []),
          ...(affection.length ? ["Affection"] : []),
        ],
        textStyle: { color: palette.text },
      },
      xAxis: {
        type: "category",
        data: data.days,
        axisLabel: { color: palette.text },
        axisLine: { lineStyle: { color: palette.subtext } },
      },
      yAxis: [
        {
          type: "value",
          name: "Messages",
          axisLabel: { color: palette.text },
          axisLine: { lineStyle: { color: palette.subtext } },
        },
        {
          type: "value",
          name: "Words",
          axisLabel: { color: palette.text },
          axisLine: { lineStyle: { color: palette.subtext } },
          position: "right",
        },
      ],
      brush: { toolbox: ["rect", "clear"], xAxisIndex: "all" },
      series: [
        {
          name: "Messages",
          type: "bar",
          data: data.msgSeries,
          itemStyle: { color: palette.series[0] },
          yAxisIndex: 0,
        },
        {
          name: "Words",
          type: "bar",
          data: data.wordSeries,
          itemStyle: { color: palette.series[1] },
          yAxisIndex: 1,
        },
        {
          name: "7d avg messages",
          type: "line",
          data: data.maMsg,
          yAxisIndex: 0,
          smooth: true,
          lineStyle: { color: palette.series[0] },
        },
        {
          name: "7d avg words",
          type: "line",
          data: data.maWord,
          yAxisIndex: 1,
          smooth: true,
          lineStyle: { color: palette.series[1] },
        },
        ...(conflicts.length
          ? [
              {
                name: "Conflicts",
                type: "scatter",
                data: conflicts,
                symbolSize: 8,
                itemStyle: { color: palette.series[2] },
                yAxisIndex: 0,
              },
            ]
          : []),
        ...(affection.length
          ? [
              {
                name: "Affection",
                type: "scatter",
                data: affection,
                symbolSize: 8,
                itemStyle: { color: palette.series[3] },
                yAxisIndex: 0,
              },
            ]
          : []),
      ],
    };
  }, [data, conflictDates, affectionDates, palette]);

  const handleBrush = (params: any) => {
    const areas = params?.batch?.[0]?.areas;
    if (!areas || !areas.length) return;
    const range = areas[0].coordRange as [number, number];
    const startIdx = Math.floor(range[0]);
    const endIdx = Math.floor(range[1]);
    const start = data.days[Math.max(0, startIdx)];
    const end = data.days[Math.min(data.days.length - 1, endIdx)];
    if (start && end) {
      setStartDate(start);
      setEndDate(end);
    }
  };

  return <Chart option={option} height={260} onEvents={{ brushselected: handleBrush }} />;
}

