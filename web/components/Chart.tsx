import dynamic from "next/dynamic";

// Load the wordcloud extension on the client before initializing ECharts.
const ReactECharts = dynamic(async () => {
  if (typeof window !== "undefined") {
    await import("echarts-wordcloud/dist/echarts-wordcloud.js");
  }
  return import("echarts-for-react");
}, { ssr: false });

export default function Chart({ option, height=260 }: { option: any; height?: number }) {
  return (
    <div className="w-full">
      <ReactECharts option={option} style={{ height }} notMerge={true} lazyUpdate={true} />
    </div>
  );
}
