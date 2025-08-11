
import { useEffect, useMemo, useState } from "react";
import { getKPIs, uploadFile, getConflicts } from "@/lib/api";
import Card from "@/components/Card";
import Chart from "@/components/Chart";
import useThemePalette from "@/lib/useThemePalette";

type KPI = any;
const formatNumber = (n: number) => n.toLocaleString();

export default function Home() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [apiVersion, setApiVersion] = useState<string>("?");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [conflictErr, setConflictErr] = useState<string | null>(null);
  const [conflictProgress, setConflictProgress] = useState<{current:number,total:number}|null>(null);
  const [selectedConflict, setSelectedConflict] = useState<any | null>(null);
  const [timelineMetric, setTimelineMetric] = useState<"messages" | "words">("messages");
  const [showTrend, setShowTrend] = useState(false);
  const [heatPerson, setHeatPerson] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);
  const palette = useThemePalette();

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_BASE||"http://localhost:8000")+"/version")
      .then(r=>r.json())
      .then(d=>setApiVersion(d.version||"?"));
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

async function fetchConflicts() {
  try {
    const p = await getConflicts((current,total)=>setConflictProgress({current,total}));
    setConflicts(p);
    setSelectedConflict(null);
    setConflictErr(null);
  } catch (e: any) {
    setConflictErr(e?.message || "Failed to load conflicts");
  } finally {
    setConflictProgress(null);
  }
}

  const onUpload = async (file: File) => {
    setBusy(true); setErr(null);
    try {
      const k = await uploadFile(file);
      setKpis(k);
      await fetchConflicts();
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
  }, [participants, palette]);


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
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { valueFormatter: (value: number) => formatNumber(value) },
      xAxis: { type: "category", data: participants, axisLabel:{color: palette.text}, axisLine:{lineStyle:{color: palette.subtext}} },
      yAxis: { type: "value", name: "seconds", axisLabel:{color: palette.text, formatter: (value:number) => formatNumber(value)}, axisLine:{lineStyle:{color: palette.subtext}} },
      series: [
        {
          type: "bar",
          data: participants.map(p => {
            const row = rs.find((r:any)=>r.person===p) || {};
            return { value: row.seconds || 0, itemStyle: { color: colorMap[p] } };
          }),
          barWidth: "40%"
        }
      ]
    };
  };

  const wordsPerMessageOption = () => {
    const rows = filteredBySender.map(r => ({
      sender: r.sender,
      messages: r.messages,
      words: r.words,
      wpm: r.messages ? r.words / r.messages : 0
    }));
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: {
        formatter: (p: any) => `${p.data.sender}<br/>Messages: ${formatNumber(p.data.messages)}<br/>Words: ${formatNumber(p.data.words)}<br/>Words/msg: ${p.data.wpm.toFixed(2)}`
      },
      xAxis: {
        type: "value",
        name: "Messages",
        axisLabel: { color: palette.text, formatter: (v:number) => formatNumber(v) },
        axisLine: { lineStyle: { color: palette.subtext } }
      },
      yAxis: {
        type: "value",
        name: "Words",
        axisLabel: { color: palette.text, formatter: (v:number) => formatNumber(v) },
        axisLine: { lineStyle: { color: palette.subtext } }
      },
      series: [
        {
          type: "scatter",
          data: rows.map(r => ({
            value: [r.messages, r.words],
            sender: r.sender,
            messages: r.messages,
            words: r.words,
            wpm: r.wpm,
            symbolSize: Math.max(20, Math.min(80, r.wpm * 5)),
            itemStyle: { color: colorMap[r.sender] }
          })),
          label: { show: true, formatter: (p:any) => p.data.sender, color: palette.text }
        }
      ]
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

  const conflictBarOption = () => {
    const months = conflicts.map(p=>p.month);
    const totals = conflicts.map(p=>p.total_conflicts);
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { valueFormatter: (value: number) => formatNumber(value) },
      xAxis: { type: "category", data: months, axisLabel:{color: palette.text}, axisLine:{lineStyle:{color: palette.subtext}} },
      yAxis: { type: "value", axisLabel:{color: palette.text, formatter: (value:number) => formatNumber(value)}, axisLine:{lineStyle:{color: palette.subtext}} },
      series: [{ type: "bar", data: totals, itemStyle:{ color: palette.series[2] }, barWidth: "60%" }],
      grid: { left: 40, right: 20, top: 20, bottom: 60 }
    };
  };

  const onConflictBarClick = (p:any) => {
    const month = p.name;
    setSelectedConflict(conflicts.find(c => c.month === month) || null);
  };

  const conflictTimelineOption = () => {
    const pts = conflicts.flatMap(p => (p.conflicts||[]).map((c:any)=>({date:c.date, summary:c.summary})));
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: {
        formatter: (p:any) => `${p.data.date}<br/>${p.data.summary}`,
        appendToBody: true,
        extraCssText: 'max-width: 320px; white-space: normal; word-break: break-word; z-index: 1000;'
      },
      xAxis: { type: "time", axisLabel:{color: palette.text}, axisLine:{lineStyle:{color: palette.subtext}} },
      yAxis: { show: false },
      series: [{ type: "scatter", symbolSize:8, data: pts.map(p=>({ value:[p.date,1], date:p.date, summary:p.summary })), itemStyle:{ color: palette.series[2] } }]
    };
  };

  const profanityAffectionOption = () => {
    const days = Array.from(new Set((kpis?.timeline_messages || []).filter((r:any)=>dateFilter(r.day)).map((r:any)=>r.day))).sort();
    const msgPerDay = days.map(d => (kpis?.timeline_messages || []).filter((r:any)=>r.day===d).reduce((s:number,r:any)=>s+r.messages,0));
    const totalMsgs = filteredTotals.messages || 1;
    const profTotal = kpis?.profanity_hits || 0;
    const affTotal = kpis?.affection_hits || 0;
    const profTrend = msgPerDay.map(c => (c / totalMsgs) * profTotal);
    const affTrend = msgPerDay.map(c => (c / totalMsgs) * affTotal);
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { valueFormatter: (v:number)=>formatNumber(Math.round(v)) },
      legend: { data:["Profanity","Affection"], textStyle:{color: palette.text} },
      xAxis: { type:"category", data: days, axisLabel:{color: palette.text}, axisLine:{lineStyle:{color: palette.subtext}} },
      yAxis: { type:"value", axisLabel:{color: palette.text, formatter:(v:number)=>formatNumber(Math.round(v))}, axisLine:{lineStyle:{color: palette.subtext}} },
      series: [
        { name:"Profanity", type:"line", smooth:true, data: profTrend, lineStyle:{width:2,color:palette.series[2]} },
        { name:"Affection", type:"line", smooth:true, data: affTrend, lineStyle:{width:2,color:palette.series[3]} }
      ]
    };
  };

  return (
    <>
      <div className="col-span-12 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-end gap-4">
          <div>
            <label className="text-sm mr-2">Start</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-white/10 rounded px-2 py-1" />
          </div>
          <div>
            <label className="text-sm mr-2">End</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-white/10 rounded px-2 py-1" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {participants.map(p => (
            <span key={p} className="flex items-center text-xs gap-1">
              <span className="w-3 h-3 rounded-full" style={{backgroundColor: colorMap[p]}}></span>
              {p}
            </span>
          ))}
          <label className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer ml-4">
            {busy ? "Uploading..." : "Upload chat"}
            <input type="file" className="hidden" accept=".txt" onChange={(e)=>e.target.files&&onUpload(e.target.files[0])} />
          </label>
        </div>
      </div>
      {err && <div className="col-span-12 text-red-400">{err}</div>}
      {conflictErr && <div className="col-span-12 text-red-400">{conflictErr}</div>}
      {!kpis && <div className="col-span-12 text-gray-300">Load sample or upload a WhatsApp export.</div>}
      {kpis && (
        <>
          <div className="col-span-12 grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <Card title="Messages" tooltip="Total messages exchanged in selected date range">
                <div className="text-2xl font-bold">{filteredTotals.messages}</div>
              </Card>
            </div>
            <div className="col-span-3">
              <Card title="Words" tooltip="Total words sent in selected date range">
                <div className="text-2xl font-bold">{filteredTotals.words}</div>
              </Card>
            </div>
            <div className="col-span-3">
              <Card title="We-ness ratio" tooltip="Share of 'we/us/our' versus first-person pronouns">
                <div className="text-2xl font-bold">{kpis.we_ness_ratio.toFixed(2)}</div>
              </Card>
            </div>
            <div className="col-span-3">
              <Card title="Profanity hits" tooltip="Count of messages containing common profanity">
                <div className="text-2xl font-bold">{kpis.profanity_hits}</div>
              </Card>
            </div>
          </div>

          <div className="col-span-12">
            <Card title="Timeline">
              <div className="flex gap-2 mb-2 items-center">
                <button onClick={()=>setTimelineMetric("messages")} className={`px-3 py-1 rounded-full ${timelineMetric==="messages"?"bg-white/20":"bg-white/10"}`}>Messages</button>
                <button onClick={()=>setTimelineMetric("words")} className={`px-3 py-1 rounded-full ${timelineMetric==="words"?"bg-white/20":"bg-white/10"}`}>Words</button>
                <label className="flex items-center text-sm ml-auto">
                  <input type="checkbox" className="mr-1" checked={showTrend} onChange={e=>setShowTrend(e.target.checked)} />
                  Trend
                </label>
              </div>
              <Chart option={timelineOption()} height={360} onEvents={{ datazoom: handleZoom }} />
              {(!kpis || (kpis[timelineMetric==="messages"?"timeline_messages":"timeline_words"]||[]).length===0) && <div className="text-sm text-gray-400 mt-2">No timeline data yet.</div>}
            </Card>
          </div>

          <div className="col-span-6">
            <Card title="Messages by sender">
              <Chart option={messagesOption()} height={260} />
            </Card>
          </div>
          <div className="col-span-6">
            <Card title="Words by sender">
              <Chart option={wordsOption()} height={260} />
            </Card>
          </div>

          <div className="col-span-6">
            <Card title="Words per message">
              <Chart option={wordsPerMessageOption()} height={260} />
            </Card>
          </div>
          <div className="col-span-6">
            <Card title="Seconds to reply">
              <Chart option={replyOption()} height={260} />
              {(!kpis?.reply_simple || kpis.reply_simple.length===0) && <div className="text-sm text-gray-400 mt-2">No alternating replies detected yet.</div>}
            </Card>
          </div>

          <div className="col-span-12">
            <Card title="Daily rhythm heatmap (weekday × hour)">
              <div className="flex gap-2 mb-2">
                <button onClick={()=>setHeatPerson("All")} className={`px-3 py-1 rounded-full ${heatPerson==="All"?"bg-white/20":"bg-white/10"}`}>All</button>
                {participants.map(p => (
                  <button key={p} onClick={()=>setHeatPerson(p)} className={`px-3 py-1 rounded-full ${heatPerson===p?"bg-white/20":"bg-white/10"}`}>{p}</button>
                ))}
              </div>
              <Chart option={heatOption()} height={360} />
            </Card>
          </div>

          <div className="col-span-6">
            <Card title="Profanity vs affection over time">
              <Chart option={profanityAffectionOption()} height={260} />
            </Card>
          </div>
          <div className="col-span-6 grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <Card title="Conflicts per month">
                {conflictProgress && <div className="text-sm text-gray-400 mb-2">Analyzing {conflictProgress.current}/{conflictProgress.total} segments...</div>}
                <Chart option={conflictBarOption()} height={200} onEvents={{ click: onConflictBarClick }} />
                {!conflictProgress && conflicts.length===0 && <div className="text-sm text-gray-400 mt-2">No conflict data yet.</div>}
              </Card>
            </div>
            <div className="col-span-12">
              <Card title={selectedConflict ? `Conflicts in ${selectedConflict.month}` : "Conflict details"}>
                {selectedConflict ? (
                  <ul className="text-sm text-gray-300 list-disc ml-5">
                    {selectedConflict.conflicts.map((c:any,i:number)=>(
                      <li key={i}><span className="font-mono">{c.date}</span>: {c.summary}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-400">
                    {conflictProgress ? "Analyzing conflicts..." : conflicts.length === 0 ? "No conflict data." : "Select a month bar to view details."}
                  </div>
                )}
              </Card>
            </div>
          </div>
          <div className="col-span-12">
            <Card title="Conflict timeline">
              <Chart option={conflictTimelineOption()} height={200} />
              {!conflictProgress && conflicts.length===0 && <div className="text-sm text-gray-400 mt-2">No conflict data yet.</div>}
            </Card>
          </div>
        </>
      )}
      <div className="col-span-12 text-xs text-gray-400">v0.2.9 — visual refinements • API v{apiVersion}</div>
    </>
  );
}
