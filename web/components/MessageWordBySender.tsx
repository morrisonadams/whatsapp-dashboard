import { useState } from "react";
import Chart from "@/components/Chart";
import useThemePalette from "@/lib/useThemePalette";
import { useParticipantColors } from "@/lib/ParticipantColors";

interface Row {
  sender: string;
  messages: number;
  words: number;
}

const formatNumber = (n: number) => n.toLocaleString();

export default function MessageWordBySender({ rows }: { rows: Row[] }) {
  const palette = useThemePalette();
  const { colorMap } = useParticipantColors();
  const [view, setView] = useState<"messages" | "words" | "both">("messages");

  const max = rows.reduce((m, r) => Math.max(m, r.messages, r.words), 0);

  const option = (field: "messages" | "words") => ({
    backgroundColor: "transparent",
    textStyle: { color: palette.text },
    tooltip: { valueFormatter: (value: number) => formatNumber(value) },
    xAxis: {
      type: "category",
      data: rows.map((r) => r.sender),
      axisLine: { lineStyle: { color: palette.subtext } },
      axisLabel: { color: palette.text },
    },
    yAxis: {
      type: "value",
      max,
      axisLine: { lineStyle: { color: palette.subtext } },
      axisLabel: { color: palette.text, formatter: (v: number) => formatNumber(v) },
    },
    series: [
      {
        type: "bar",
        data: rows.map((r) => ({ value: r[field], itemStyle: { color: colorMap[r.sender] } })),
        barWidth: "40%",
      },
    ],
  });

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setView("messages")}
          className={`px-3 py-1 rounded-full ${view === "messages" ? "bg-white/20" : "bg-white/10"}`}
        >
          Messages
        </button>
        <button
          onClick={() => setView("words")}
          className={`px-3 py-1 rounded-full ${view === "words" ? "bg-white/20" : "bg-white/10"}`}
        >
          Words
        </button>
        <button
          onClick={() => setView("both")}
          className={`px-3 py-1 rounded-full ${view === "both" ? "bg-white/20" : "bg-white/10"}`}
        >
          Both
        </button>
      </div>
      {view === "both" ? (
        <div className="flex gap-4">
          <div className="flex-1">
            <Chart option={option("messages")} height={260} />
          </div>
          <div className="flex-1">
            <Chart option={option("words")} height={260} />
          </div>
        </div>
      ) : (
        <Chart option={option(view)} height={260} />
      )}
    </div>
  );
}
