
import { useEffect, useMemo, useState } from "react";
import { getKPIs, loadSample, uploadFile } from "@/lib/api";
import Card from "@/components/Card";
import Chart from "@/components/Chart";

type KPI = any;

const palette = {
  bg: "radial-gradient(1200px 600px at 20% 10%, rgba(143,76,255,0.25), transparent 60%), radial-gradient(1000px 600px at 80% 20%, rgba(0,184,255,0.18), transparent 60%), radial-gradient(1000px 600px at 50% 80%, rgba(255,80,150,0.18), transparent 60%), #0b0f17",
  text: "#e6e8ef",
  subtext: "#9aa4b2",
  surfaces: "#0f1521",
  series: ["#a78bfa", "#22d3ee", "#f59e0b", "#ef4444", "#10b981", "#f472b6"]
};
const formatNumber = (n: number) => n.toLocaleString();

export default function Home() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [apiVersion, setApiVersion] = useState<string>("?");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [timelineMetric, setTimelineMetric] = useState<"messages" | "words">("messages");
  const [showTrend, setShowTrend] = useState(false);
  const [heatPerson, setHeatPerson] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_BASE||"http://localhost:8000")+"/version").then(r=>r.json()).then(d=>setApiVersion(d.version||"?"));
    // auto-load sample on first visit
    loadSample().then(setKpis).catch(() => {});
  }, []);

  useEffect(() => {
    if (!kpis) return;
    const days = (kpis.timeline_messages || []).map((r:any)=>r.day).sort();
    if (days.length) {
      setStartDate(days[0]);
      setEndDate(days[days.length - 1]);
    }
  }, [kpis]);

  useEffect(() => {
    setZoomRange(null);
  }, [timelineMetric, startDate, endDate, kpis]);

  const onUpload = async (file: File) => {
    setBusy(true); setErr(null);
    try {
      const k = await uploadFile(file);
      setKpis(k);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const participants: string[] = useMemo(() => kpis?.participants ?? (kpis?.by_sender?.map((r:any)=>r.sender) ?? []), [kpis]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    participants.forEach((p, i) => {
      map[p] = palette.series[i % palette.series.length];
    });
    return map;
  }, [participants]);

  const wordCloudParticipants = participants.slice(0, 2);

  const dateFilter = (day: string) => {
    if (startDate && day < startDate) return false;
    if (endDate && day > endDate) return false;
    return true;
  };

  const filteredBySender = useMemo(() => {
    if (!kpis) return [] as Array<any>;
    if (!startDate && !endDate) return kpis.by_sender || [];
    const msgMap: Record<string, number> = {};
    const wordMap: Record<string, number> = {};
    (kpis.timeline_messages || []).filter((r:any)=>dateFilter(r.day)).forEach((r:any)=>{
      msgMap[r.sender] = (msgMap[r.sender]||0) + r.messages;
    });
    (kpis.timeline_words || []).filter((r:any)=>dateFilter(r.day)).forEach((r:any)=>{
      wordMap[r.sender] = (wordMap[r.sender]||0) + r.words;
    });
    return participants.map(p => ({ sender: p, messages: msgMap[p]||0, words: wordMap[p]||0 }));
  }, [kpis, startDate, endDate, participants]);

  const filteredTotals = useMemo(() => {
    if (!kpis) return { messages: 0, words: 0 };
    if (!startDate && !endDate) return kpis.totals;
    const totalMessages = (kpis.timeline_messages || []).filter((r:any)=>dateFilter(r.day)).reduce((s:number,r:any)=>s+r.messages,0);
    const totalWords = (kpis.timeline_words || []).filter((r:any)=>dateFilter(r.day)).reduce((s:number,r:any)=>s+r.words,0);
    return { messages: totalMessages, words: totalWords };
  }, [kpis, startDate, endDate]);

  const handleZoom = (e: any) => {
    const dz = Array.isArray(e.batch) && e.batch.length ? e.batch[0] : e;
    if (dz.start == null || dz.end == null) return;
    const key = timelineMetric === "messages" ? "timeline_messages" : "timeline_words";
    const tl = (kpis?.[key] || []).filter((r:any)=>dateFilter(r.day));
    const days = Array.from(new Set(tl.map((r:any)=>r.day))).sort();
    if (days.length < 2) return;
    const len = days.length - 1;
    const startIdx = Math.round((dz.start / 100) * len);
    const endIdx = Math.round((dz.end / 100) * len);
    setZoomRange([startIdx, endIdx]);
  };

  const messagesOption = () => {
    const rows = filteredBySender;
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { valueFormatter: (value: number) => formatNumber(value) },
      xAxis: { type: "category", data: rows.map((r:any)=>r.sender), axisLine:{lineStyle:{color: palette.subtext}}, axisLabel:{color: palette.text} },
      yAxis: { type: "value", axisLine:{lineStyle:{color: palette.subtext}}, axisLabel:{color: palette.text, formatter: (value:number) => formatNumber(value)} },
      series: [
        {
          type: "bar",
          data: rows.map((r:any)=>({ value: r.messages, itemStyle: { color: colorMap[r.sender] } })),
          barWidth: "40%"
        }
      ]
    };
  };

  const wordsOption = () => {
    const rows = filteredBySender;
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { valueFormatter: (value: number) => formatNumber(value) },
      xAxis: { type: "category", data: rows.map((r:any)=>r.sender), axisLine:{lineStyle:{color: palette.subtext}}, axisLabel:{color: palette.text} },
      yAxis: { type: "value", axisLine:{lineStyle:{color: palette.subtext}}, axisLabel:{color: palette.text, formatter: (value:number) => formatNumber(value)} },
      series: [
        {
          type: "bar",
          data: rows.map((r:any)=>({ value: r.words, itemStyle: { color: colorMap[r.sender] } })),
          barWidth: "40%"
        }
      ]
    };
  };

  const replyOption = () => {
    const rs = (kpis?.reply_simple || []) as Array<any>;
    const metrics = ["median", "mean"];
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { valueFormatter: (value: number) => formatNumber(value) },
      legend: { data: participants, textStyle:{color: palette.text} },
      xAxis: { type: "category", data: metrics, axisLabel:{color: palette.text}, axisLine:{lineStyle:{color: palette.subtext}} },
      yAxis: { type: "value", name: "seconds", axisLabel:{color: palette.text, formatter: (value:number) => formatNumber(value)}, axisLine:{lineStyle:{color: palette.subtext}} },
      series: participants.map(p => {
        const row = rs.find((r:any)=>r.person===p) || {};
        return {
          name: p,
          type: "bar",
          data: metrics.map(m => m === "median" ? (row.median || 0) : (row.mean || 0)),
          itemStyle: { color: colorMap[p] }
        };
      })
    };
  };

  const timelineOption = () => {
    const key = timelineMetric === "messages" ? "timeline_messages" : "timeline_words";
    const tlAll = (kpis?.[key] || []).filter((r:any)=>dateFilter(r.day));
    const allDays: string[] = Array.from(new Set<string>(tlAll.map((r:any)=>r.day))).sort();
    let startIdx = zoomRange ? zoomRange[0] : 0;
    let endIdx = zoomRange ? zoomRange[1] : allDays.length - 1;
    startIdx = Math.max(0, Math.min(startIdx, allDays.length - 1));
    endIdx = Math.max(0, Math.min(endIdx, allDays.length - 1));
    if (endIdx < startIdx) endIdx = startIdx;
    const visibleDays = allDays.slice(startIdx, endIdx + 1);
    const visibleTl = tlAll.filter((r:any) => {
      const idx = allDays.indexOf(r.day);
      return idx >= startIdx && idx <= endIdx;
    });
    const senders: string[] = Array.from(new Set(visibleTl.map((r:any)=>r.sender)));
    const useWeeks = visibleDays.length > 90;
    let axis: string[] = [];
    const dataPerSender: Record<string, number[]> = {};
    senders.forEach(s => dataPerSender[s] = []);
    if (useWeeks) {
      const getWeekStart = (dStr: string) => {
        const d = new Date(dStr + "T00:00:00Z");
        const day = d.getUTCDay();
        const diff = (day + 6) % 7;
        d.setUTCDate(d.getUTCDate() - diff);
        return d.toISOString().slice(0,10);
      };
      const weekMap: Record<string, Record<string, number>> = {};
      visibleTl.forEach((r:any) => {
        const week = getWeekStart(r.day);
        if (!weekMap[week]) weekMap[week] = {};
        weekMap[week][r.sender] = (weekMap[week][r.sender] || 0) + (timelineMetric === "messages" ? r.messages : r.words);
      });
      axis = Object.keys(weekMap).sort();
      senders.forEach(s => {
        dataPerSender[s] = axis.map(w => weekMap[w][s] || 0);
      });
    } else {
      const dayMap: Record<string, Record<string, number>> = {};
      visibleTl.forEach((r:any) => {
        if (!dayMap[r.day]) dayMap[r.day] = {};
        dayMap[r.day][r.sender] = (timelineMetric === "messages" ? r.messages : r.words);
      });
      axis = visibleDays;
      senders.forEach(s => {
        dataPerSender[s] = axis.map(d => (dayMap[d] && dayMap[d][s]) || 0);
      });
    }
    const series = senders.map((s: string, i:number) => {
      const values = dataPerSender[s];
      let markLine: any = undefined;
      if (showTrend && values.length > 1) {
        const n = values.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let j = 0; j < n; j++) {
          sumX += j;
          sumY += values[j];
          sumXY += j * values[j];
          sumXX += j * j;
        }
        const denom = n * sumXX - sumX * sumX || 1;
        const slope = (n * sumXY - sumX * sumY) / denom;
        const intercept = (sumY - slope * sumX) / n;
        const startY = intercept;
        const endY = intercept + slope * (n - 1);
        markLine = {
          symbol: "none",
          lineStyle: { type: "dashed", color: colorMap[s] || palette.series[i % palette.series.length] },
          data: [[{ coord: [axis[0], startY] }, { coord: [axis[n - 1], endY] }]]
        };
      }
      return {
        name: s,
        type: "line",
        smooth: true,
        lineStyle: { width: 3 },
        itemStyle: { color: colorMap[s] || palette.series[i % palette.series.length] },
        data: values,
        ...(markLine ? { markLine } : {})
      };
    });
    const lenAll = Math.max(1, allDays.length - 1);
    const startPercent = (startIdx / lenAll) * 100;
    const endPercent = (endIdx / lenAll) * 100;
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { valueFormatter: (value: number) => formatNumber(value) },
      dataZoom: [
        { type: 'inside', start: startPercent, end: endPercent },
        { type: 'slider', start: startPercent, end: endPercent }
      ],
      legend: { data: senders, textStyle:{color: palette.text} },
      xAxis: { type: "category", data: axis, axisLabel:{color: palette.text}, axisLine:{lineStyle:{color: palette.subtext}} },
      yAxis: { type: "value", axisLabel:{color: palette.text, formatter: (value:number) => formatNumber(value)}, axisLine:{lineStyle:{color: palette.subtext}} },
      series
    };
  };

  const heatOption = () => {
    const hm = (kpis?.heatmap || []).filter((r:any)=> heatPerson==="All" ? true : r.sender===heatPerson);
    const hours = Array.from({length:24}).map((_,i)=>i);
    const weekdays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const mat = Array.from({length:7},()=>Array(24).fill(0));
    hm.forEach((r:any)=>{ mat[r.weekday][r.hour] += r.count; });
    const data:any[] = [];
    for (let w=0; w<7; w++) for (let h=0; h<24; h++) data.push([h, w, mat[w][h]]);
    const vmax = Math.max(1, ...data.map((d:any)=>d[2]));
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { valueFormatter: (value: number) => formatNumber(value) },
      xAxis: { type: "category", data: hours, axisLabel:{color: palette.text}, axisLine:{lineStyle:{color: palette.subtext}} },
      yAxis: { type: "category", data: weekdays, axisLabel:{color: palette.text}, axisLine:{lineStyle:{color: palette.subtext}} },
      visualMap: { min: 0, max: vmax, calculable: true, orient:"horizontal", left:"center", textStyle:{color: palette.text}, inRange:{color:[palette.series[0], palette.series[1], palette.series[5]]} },
      series: [{
        type: "heatmap",
        data,
        label: { show: false },
      }]
    };
  };

  const wordCloudOption = (person: string) => {
    const data = (kpis?.word_cloud?.[person] || []) as Array<{name:string; value:number}>;
    return {
      backgroundColor: "transparent",
      tooltip: {},
      series: [{
        type: 'wordCloud',
        gridSize: 8,
        sizeRange: [12, 50],
        rotationRange: [0, 0],
        textStyle: { color: colorMap[person] },
        data
      }]
    };
  };

  const affSplit = (kpis?.affection_split ?? []) as Array<{sender:string; affection:number}>;
  const qSplit = (kpis?.questions_split ?? []) as Array<{sender:string; questions:number; unanswered_15m:number}>;
  const bySender = (kpis?.by_sender ?? []) as Array<{sender:string; media:number}>;

  const cardSplit = (metric: "affection" | "questions" | "unanswered" | "attachments") => {
    const rows = participants.map(p => {
      if (metric==="attachments") {
        const r = bySender.find(r=>r.sender===p);
        return { sender: p, value: r ? r.media : 0 };
      } else if (metric==="affection") {
        const r = affSplit.find(r=>r.sender===p);
        return { sender: p, value: r ? r.affection : 0 };
      } else if (metric==="questions") {
        const r = qSplit.find(r=>r.sender===p);
        return { sender: p, value: r ? r.questions : 0 };
      } else {
        const r = qSplit.find(r=>r.sender===p);
        return { sender: p, value: r ? r.unanswered_15m : 0 };
      }
    });
    return (
      <div className="mt-2 text-sm text-gray-300 grid grid-cols-2 gap-2">
        {rows.map(r => <div key={r.sender} className="flex items-center justify-between"><span>{r.sender}</span><span className="font-semibold">{r.value}</span></div>)}
      </div>
    );
  };

  return (
    <div style={{ background: palette.bg }} className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">WhatsApp Relationship Analytics - v0.2.9</h1>
          <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer">
            {busy ? "Uploading..." : "Upload .txt"}
            <input type="file" className="hidden" accept=".txt" onChange={(e)=>e.target.files&&onUpload(e.target.files[0])} />
          </label>
        </div>
        {err && <div className="text-red-400">{err}</div>}
        {!kpis && <div className="text-gray-300">Load sample or upload a WhatsApp export.</div>}
        {kpis && (
          <>
            <div className="flex flex-col md:flex-row gap-2 md:items-end">
              <div>
                <label className="text-sm mr-2">Start</label>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-white/10 rounded px-2 py-1" />
              </div>
              <div>
                <label className="text-sm mr-2">End</label>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-white/10 rounded px-2 py-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Card title="Messages" tooltip="Total messages exchanged in selected date range">
                <div className="text-2xl font-bold">{filteredTotals.messages}</div>
              </Card>
              <Card title="Words" tooltip="Total words sent in selected date range">
                <div className="text-2xl font-bold">{filteredTotals.words}</div>
              </Card>
              <Card title="We-ness ratio" tooltip="Share of 'we/us/our' versus first-person pronouns">
                <div className="text-2xl font-bold">{kpis.we_ness_ratio.toFixed(2)}</div>
              </Card>
              <Card title="Profanity hits" tooltip="Count of messages containing common profanity">
                <div className="text-2xl font-bold">{kpis.profanity_hits}</div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Messages by sender">
                <Chart option={messagesOption()} />
              </Card>
              <Card title="Words by sender">
                <Chart option={wordsOption()} />
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card title="Time to reply (seconds) — median & mean">
                <Chart option={replyOption()} />
                {(!kpis?.reply_simple || kpis.reply_simple.length===0) && <div className="text-sm text-gray-400 mt-2">No alternating replies detected yet.</div>}
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card title="Timeline">
                <div className="flex gap-2 mb-2 items-center">
                  <button onClick={()=>setTimelineMetric("messages")} className={`px-3 py-1 rounded-full ${timelineMetric==="messages"?"bg-white/20":"bg-white/10"}`}>Messages</button>
                  <button onClick={()=>setTimelineMetric("words")} className={`px-3 py-1 rounded-full ${timelineMetric==="words"?"bg-white/20":"bg-white/10"}`}>Words</button>
                  <label className="flex items-center text-sm ml-auto">
                    <input type="checkbox" className="mr-1" checked={showTrend} onChange={e=>setShowTrend(e.target.checked)} />
                    Trend
                  </label>
                </div>
                <Chart option={timelineOption()} height={280} onEvents={{ datazoom: handleZoom }} />
                {(!kpis || (kpis[timelineMetric==="messages"?"timeline_messages":"timeline_words"]||[]).length===0) && <div className="text-sm text-gray-400 mt-2">No timeline data yet.</div>}
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card title="Daily rhythm heatmap (weekday × hour)">
                <div className="flex gap-2 mb-2">
                  <button onClick={()=>setHeatPerson("All")} className={`px-3 py-1 rounded-full ${heatPerson==="All"?"bg-white/20":"bg-white/10"}`}>All</button>
                  {participants.map(p => (
                    <button key={p} onClick={()=>setHeatPerson(p)} className={`px-3 py-1 rounded-full ${heatPerson===p?"bg-white/20":"bg-white/10"}`}>{p}</button>
                  ))}
                </div>
                <Chart option={heatOption()} height={320} />
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card title="Word cloud by participant">
                {wordCloudParticipants.length === 2 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wordCloudParticipants.map(p => (
                      <div key={p}>
                        <div className="text-center mb-1 font-semibold">{p}</div>
                        <Chart option={wordCloudOption(p)} height={260} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Need two participants for word clouds.</div>
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card title="Questions (total & per person)">
                <div className="text-3xl">{kpis.questions.total}</div>
                <div className="text-sm text-gray-300">Unanswered within 15m: {kpis.questions.unanswered_15m}</div>
                {cardSplit("questions")}
                <div className="mt-1 text-sm text-gray-300">Unanswered per person:</div>
                {cardSplit("unanswered")}
              </Card>
              <Card title="Attachments (total & per person)">
                <div className="text-3xl">{kpis.media_total}</div>
                {cardSplit("attachments")}
              </Card>
              <Card title="Affection markers (total & per person)">
                <div className="text-3xl">{kpis.affection_hits}</div>
                {cardSplit("affection")}
              </Card>
            </div>
          </>
        )}
        <div className="text-xs text-gray-400">v0.2.9 — visual refinements • API v{apiVersion}</div>
      </div>
    </div>
  );
}
