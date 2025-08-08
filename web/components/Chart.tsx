import dynamic from "next/dynamic";
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export default function Chart({ option, height=260 }: { option: any; height?: number }) {
  return (
    <div className="w-full">
      <ReactECharts option={option} style={{ height }} notMerge={true} lazyUpdate={true} />
    </div>
  );
}
