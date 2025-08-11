import dynamic from "next/dynamic";

// Load the wordcloud extension on the client before initializing ECharts.
const ReactECharts = dynamic(async () => {
  if (typeof window !== "undefined") {
    await import("echarts-wordcloud");
  }
  return import("echarts-for-react");
}, { ssr: false });

export default function Chart({ option, height = 260, onEvents = {} }: { option: any; height?: number; onEvents?: any }) {
  const legendHandler = (params: any, chart: any) => {
    if (params.event?.event?.altKey) {
      const names = (chart.getOption().series || []).map((s: any) => s.name);
      const selected: Record<string, boolean> = {};
      names.forEach((n: string) => {
        selected[n] = n === params.name;
      });
      chart.setOption({ legend: { selected } });
    }
  };

  const mergedEvents = {
    ...onEvents,
    legendselectchanged: (p: any, c: any) => {
      legendHandler(p, c);
      if (onEvents.legendselectchanged) onEvents.legendselectchanged(p, c);
    },
  };

  return (
    <div className="w-full">
      <ReactECharts option={option} style={{ height }} notMerge={true} lazyUpdate={true} onEvents={mergedEvents} />
    </div>
  );
}
