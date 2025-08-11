import Chart from "@/components/Chart";
import useThemePalette from "@/lib/useThemePalette";

interface KpiCardProps {
  title: string;
  value: number;
  trend?: number[];
  delta?: number; // percentage
  tooltip?: string;
}

const formatNumber = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString();
};

export default function KpiCard({ title, value, trend = [], delta, tooltip }: KpiCardProps) {
  const palette = useThemePalette();

  const option = {
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: "category", show: false, data: trend.map((_, i) => i) },
    yAxis: { type: "value", show: false },
    series: [
      {
        type: "line",
        data: trend,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, color: palette.series[0] },
        areaStyle: { color: palette.series[0], opacity: 0.3 },
      },
    ],
  };

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-md backdrop-blur-md"
      title={tooltip}
    >
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-sub">{title}</h2>
        {delta !== undefined && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              delta >= 0 ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">{formatNumber(value)}</div>
      {trend.length > 0 && <Chart option={option} height={40} />}
    </div>
  );
}
