
import { useEffect, useMemo, useState } from "react";
import { getKPIs, uploadFile, getConflicts } from "@/lib/api";
import Card from "@/components/Card";
import Chart from "@/components/Chart";
import MessageWordBySender from "@/components/MessageWordBySender";
import useThemePalette from "@/lib/useThemePalette";
import DeltaBadge from "@/components/DeltaBadge";
import ConflictTimelineStrip from "@/components/ConflictTimelineStrip";
import ConflictCardList from "@/components/ConflictCardList";
import { useParticipantColors } from "@/lib/ParticipantColors";
import DailyRhythmHeatmap from "@/components/DailyRhythmHeatmap";
import ReplyTimeDistribution from "@/components/ReplyTimeDistribution";
import UnifiedTimeline from "@/components/UnifiedTimeline";
import KpiStrip from "@/components/KpiStrip";
import useThemePalette from "@/lib/useThemePalette";
import SenderShareChart from "@/components/SenderShareChart";
import { DateRangeContext } from "@/lib/DateRangeContext";

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
  const [conflictDateFilter, setConflictDateFilter] = useState<string | null>(null);
  const [timelineMetric, setTimelineMetric] = useState<"messages" | "words">("messages");
  const [showTrend, setShowTrend] = useState(false);
  const [heatPerson, setHeatPerson] = useState<string>("All");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [compareMode, setCompareMode] = useState(false);
  const palette = useThemePalette();
  const { start: startDate, end: endDate } = dateRange;
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const palette = useThemePalette();
  const { participants, colorMap, setParticipants } = useParticipantColors();

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_BASE||"http://localhost:8000")+"/version")
      .then(r=>r.json())
      .then(d=>setApiVersion(d.version||"?"));
  }, []);

  useEffect(() => {
    if (!kpis) return;
    const days = (kpis.timeline_messages || []).map((r:any)=>r.day).sort();
    if (days.length) {
      setDateRange({ start: days[0], end: days[days.length - 1] });
    }
  }, [kpis]);


  useEffect(() => {
    const ps = kpis?.participants ?? (kpis?.by_sender?.map((r:any)=>r.sender) ?? []);
    setParticipants(ps);
  }, [kpis, setParticipants]);

   useEffect(() => {
    setZoomRange(null);
  }, [timelineMetric, startDate, endDate, kpis]);


async function fetchConflicts() {
  try {
    const p = await getConflicts((current,total)=>setConflictProgress({current,total}));
    setConflicts(p);
    setConflictDateFilter(null);
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


  const allConflicts = useMemo(() => conflicts.flatMap(p => p.conflicts || []), [conflicts]);
  const wordCloudParticipants = participants.slice(0, 2);
  const wordCategories = ["emoji", "swear", "sexual", "space"];
  const [wordFilters, setWordFilters] = useState<string[]>([]);


  const dateFilter = (day: string) => {
    if (startDate && day < startDate) return false;
    if (endDate && day > endDate) return false;
    return true;
  };

  const heatDays = useMemo<string[]>(() => {
    const key = timelineMetric === "messages" ? "timeline_messages" : "timeline_words";
    const tl = (kpis?.[key] || []).filter((r:any) => dateFilter(r.day));
    return Array.from(new Set(tl.map((r:any)=>r.day))).sort() as string[];
  }, [kpis, timelineMetric, startDate, endDate]);

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

  const prevRange = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T00:00:00Z");
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const prevEnd = new Date(start.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - (diff - 1) * 86400000);
    return {
      start: prevStart.toISOString().slice(0, 10),
      end: prevEnd.toISOString().slice(0, 10),
    };
  }, [startDate, endDate]);

  const prevTotals = useMemo(() => {
    if (!kpis || !prevRange) return { messages: 0, words: 0 };
    const totalMessages = (kpis.timeline_messages || []).filter((r:any)=>r.day>=prevRange.start && r.day<=prevRange.end).reduce((s:number,r:any)=>s+r.messages,0);
    const totalWords = (kpis.timeline_words || []).filter((r:any)=>r.day>=prevRange.start && r.day<=prevRange.end).reduce((s:number,r:any)=>s+r.words,0);
    return { messages: totalMessages, words: totalWords };
  }, [kpis, prevRange]);

  const deltaTotals = useMemo(() => ({
    messages: filteredTotals.messages - prevTotals.messages,
    words: filteredTotals.words - prevTotals.words,
  }), [filteredTotals, prevTotals]);

  const weProfMetrics = useMemo(() => {
    if (!kpis) return { we: 0, prof: 0, weDelta: 0, profDelta: 0 };
    const weTotal = (kpis.timeline_we || []).filter((r:any)=>dateFilter(r.day)).reduce((s:number,r:any)=>s+r.we,0);
    const profTotal = (kpis.timeline_profanity || []).filter((r:any)=>dateFilter(r.day)).reduce((s:number,r:any)=>s+r.profanity,0);
    const curWords = filteredTotals.words || 0;
    const weRate = curWords ? (weTotal / curWords) * 1000 : 0;
    const profRate = curWords ? (profTotal / curWords) * 1000 : 0;

    if (!startDate || !endDate) {
      return { we: weRate, prof: profRate, weDelta: 0, profDelta: 0 };
    }

    const dayMs = 86400000;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const span = Math.round((end.getTime() - start.getTime()) / dayMs) + 1;
    const prevEnd = new Date(start.getTime() - dayMs);
    const prevStart = new Date(prevEnd.getTime() - (span - 1) * dayMs);
    const ps = prevStart.toISOString().slice(0,10);
    const pe = prevEnd.toISOString().slice(0,10);
    const prevFilter = (day: string) => day >= ps && day <= pe;
    const prevWe = (kpis.timeline_we || []).filter((r:any)=>prevFilter(r.day)).reduce((s:number,r:any)=>s+r.we,0);
    const prevProf = (kpis.timeline_profanity || []).filter((r:any)=>prevFilter(r.day)).reduce((s:number,r:any)=>s+r.profanity,0);
    const prevWords = (kpis.timeline_words || []).filter((r:any)=>prevFilter(r.day)).reduce((s:number,r:any)=>s+r.words,0);
    const prevWeRate = prevWords ? (prevWe / prevWords) * 1000 : 0;
    const prevProfRate = prevWords ? (prevProf / prevWords) * 1000 : 0;
    return { we: weRate, prof: profRate, weDelta: weRate - prevWeRate, profDelta: profRate - prevProfRate };
  }, [kpis, startDate, endDate, filteredTotals]);


  const handleZoom = (e: any) => {
    const dz = Array.isArray(e.batch) && e.batch.length ? e.batch[0] : e;
    if (dz.start == null || dz.end == null) return;
    const key = timelineMetric === "messages" ? "timeline_messages" : "timeline_words";
    const tl = (kpis?.[key] || []);
    const days: string[] = Array.from(new Set<string>(tl.map((r:any)=>r.day))).sort();
    if (days.length < 2) return;
    const len = days.length - 1;
    if (heatDays.length < 2) return;
    const len = heatDays.length - 1;
    const startIdx = Math.round((dz.start / 100) * len);
    const endIdx = Math.round((dz.end / 100) * len);
    setDateRange({ start: days[startIdx] || "", end: days[endIdx] || "" });
  };

  const messagesOption = () => {
    const rows = filteredBySender;
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { valueFormatter: (value: number) => formatNumber(value) },
      xAxis: { type: "category", data: rows.map((r:any)=>r.sender), axisLine:{lineStyle:{color: palette.subtext}}, axisLabel:{color: palette.text} },
      yAxis: { type: "value", name: "Messages", axisLine:{lineStyle:{color: palette.subtext}}, axisLabel:{color: palette.text, formatter: (value:number) => formatNumber(value)} },
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
      yAxis: { type: "value", name: "Words", axisLine:{lineStyle:{color: palette.subtext}}, axisLabel:{color: palette.text, formatter: (value:number) => formatNumber(value)} },
      series: [
        {
          type: "bar",
          data: rows.map((r:any)=>({ value: r.words, itemStyle: { color: colorMap[r.sender] } })),
          barWidth: "40%"
        }
      ]
    };
  };

  const wordsPerMessageOption = () => {
  const replyOption = () => {
    const rs = (kpis?.reply_simple || []) as Array<any>;
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: { valueFormatter: (value: number) => formatNumber(value) },
      xAxis: { type: "category", data: participants, axisLabel:{color: palette.text}, axisLine:{lineStyle:{color: palette.subtext}} },
      yAxis: { type: "value", name: "Seconds", axisLabel:{color: palette.text, formatter: (value:number) => formatNumber(value)}, axisLine:{lineStyle:{color: palette.subtext}} },
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

  const messagesWordsPerDayOption = () => {
    const daySet = new Set<string>();
    (kpis?.timeline_messages || []).forEach((r:any)=>{ if(dateFilter(r.day)) daySet.add(r.day); });
    const days = daySet.size || 1;
    const rows = filteredBySender.map(r => ({
      sender: r.sender,
      messagesPerDay: r.messages / days,
      wordsPerDay: r.words / days,
      mpw: r.words ? r.messages / r.words : 0
    }));
    return {
      backgroundColor: "transparent",
      textStyle: { color: palette.text },
      tooltip: {
        formatter: (p: any) => `${p.data.sender}<br/>Messages/day: ${p.data.messagesPerDay.toFixed(2)}<br/>Words/day: ${p.data.wordsPerDay.toFixed(2)}<br/>Msgs/word: ${p.data.mpw.toFixed(2)}`
      },
      xAxis: {
        type: "value",
        name: "Messages/day",
        axisLabel: { color: palette.text, formatter: (v:number) => formatNumber(v) },
        axisLine: { lineStyle: { color: palette.subtext } }
      },
      yAxis: {
        type: "value",
        name: "Words/day",
        axisLabel: { color: palette.text, formatter: (v:number) => formatNumber(v) },
        axisLine: { lineStyle: { color: palette.subtext } }
      },
      series: [
        {
          type: "scatter",
          data: rows.map(r => ({
            value: [r.messagesPerDay, r.wordsPerDay],
            sender: r.sender,
            messagesPerDay: r.messagesPerDay,
            wordsPerDay: r.wordsPerDay,
            mpw: r.mpw,
            symbolSize: Math.max(20, Math.min(80, r.mpw * 200)),
            itemStyle: { color: colorMap[r.sender] }
          })),
          label: { show: true, formatter: (p:any) => p.data.sender, color: palette.text }
        }
      ]
    };
  };

  const timelineOption = () => {
    const key = timelineMetric === "messages" ? "timeline_messages" : "timeline_words";
    const tlAll = (kpis?.[key] || []);
    const allDays: string[] = Array.from(new Set<string>(tlAll.map((r:any)=>r.day))).sort();
    let startIdx = startDate ? allDays.indexOf(startDate) : 0;
    let endIdx = endDate ? allDays.indexOf(endDate) : allDays.length - 1;
    startIdx = startIdx < 0 ? 0 : startIdx;
    endIdx = endIdx < 0 ? allDays.length - 1 : endIdx;
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
      yAxis: { type: "value", name: timelineMetric === "messages" ? "Messages" : "Words", axisLabel:{color: palette.text, formatter: (value:number) => formatNumber(value)}, axisLine:{lineStyle:{color: palette.subtext}} },
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
      xAxis: { type: "category", name: "Hour", data: hours, axisLabel:{color: palette.text}, axisLine:{lineStyle:{color: palette.subtext}} },
      yAxis: { type: "category", name: "Weekday", data: weekdays, axisLabel:{color: palette.text}, axisLine:{lineStyle:{color: palette.subtext}} },
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
      yAxis: { type: "value", name: "Conflicts", axisLabel:{color: palette.text, formatter: (value:number) => formatNumber(value)}, axisLine:{lineStyle:{color: palette.subtext}} },
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
        {rows.map(r => (
          <div key={r.sender} className="flex items-center justify-between"><span>{r.sender}</span><span className="font-semibold">{formatNumber(r.value)}</span></div>
        ))}
      </div>
    );
  };

  return (
    <DateRangeContext.Provider value={{ startDate, endDate, setStartDate, setEndDate }}>
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
          <section id="overview" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-2 md:items-end">
              <div>
                <label className="text-sm mr-2">Start</label>
                <input type="date" value={startDate} onChange={e=>setDateRange(r=>({...r,start:e.target.value}))} className="bg-white/10 rounded px-2 py-1" />
              </div>
              <div>
                <label className="text-sm mr-2">End</label>
                <input type="date" value={endDate} onChange={e=>setDateRange(r=>({...r,end:e.target.value}))} className="bg-white/10 rounded px-2 py-1" />
              </div>
              <label className="flex items-center text-sm ml-auto">
                <input type="checkbox" className="mr-1" checked={compareMode} onChange={e=>setCompareMode(e.target.checked)} />
                Compare
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Card
                title="Messages"
                tooltip="Total messages exchanged in selected date range"
                badge={compareMode && prevRange ? <DeltaBadge value={deltaTotals.messages} /> : undefined}
              >
                <div className="text-2xl font-bold">{filteredTotals.messages}</div>
              </Card>
              <Card
                title="Words"
                tooltip="Total words sent in selected date range"
                badge={compareMode && prevRange ? <DeltaBadge value={deltaTotals.words} /> : undefined}
              >
                <div className="text-2xl font-bold">{filteredTotals.words}</div>
              <Card title="Messages" tooltip="Total messages exchanged in selected date range">
                <div className="text-2xl font-bold">{formatNumber(filteredTotals.messages)}</div>
              </Card>
              <Card title="Words" tooltip="Total words sent in selected date range">
                <div className="text-2xl font-bold">{formatNumber(filteredTotals.words)}</div>
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
              <Card title="We-ness /1k words" tooltip="Occurrences of 'we/us/our' per 1,000 words compared to previous period">
                <div className="text-2xl font-bold">{weProfMetrics.we.toFixed(2)}</div>
                {startDate && endDate && <div className="text-sm text-gray-300">{weProfMetrics.weDelta>=0?"+":""}{weProfMetrics.weDelta.toFixed(2)}</div>}
              </Card>
              <Card title="Profanity /1k words" tooltip="Messages with profanity per 1,000 words compared to previous period">
                <div className="text-2xl font-bold">{weProfMetrics.prof.toFixed(2)}</div>
                {startDate && endDate && <div className="text-sm text-gray-300">{weProfMetrics.profDelta>=0?"+":""}{weProfMetrics.profDelta.toFixed(2)}</div>}
              </Card>
            </div>
            <KpiStrip kpis={kpis} startDate={startDate} endDate={endDate} />
          </section>
          <section id="timeline" className="mt-6">
            <Card title="Timeline">
              <UnifiedTimeline
                timelineMessages={kpis.timeline_messages || []}
                timelineWords={kpis.timeline_words || []}
                conflictDates={conflictDates}
                affectionDates={affectionDates}
              />
            </Card>
          </section>

          <section id="analytics" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <Card title="Messages & words by sender">
                <MessageWordBySender rows={filteredBySender} />
          <section id="analytics" className="grid grid-cols-1 xl:grid-cols-3 xl:grid-rows-5 gap-6">
            <div>
              <Card
                title="Messages by sender"
                badge={compareMode && prevRange ? <DeltaBadge value={deltaTotals.messages} /> : undefined}
              >

                <Chart option={messagesOption()} height={260} />
              </Card>
            </div>
            <div>
              <Card
                title="Words by sender"
                badge={compareMode && prevRange ? <DeltaBadge value={deltaTotals.words} /> : undefined}
              >
                <Chart option={wordsOption()} height={260} />
              </Card>
            </div>
            <div className="xl:row-span-2">
              <Card
                title="Timeline"
                badge={compareMode && prevRange ? <DeltaBadge value={timelineMetric === "messages" ? deltaTotals.messages : deltaTotals.words} /> : undefined}
              >
                <div className="flex gap-2 mb-2 items-center">
                  <button onClick={()=>setTimelineMetric("messages")} className={`px-3 py-1 rounded-full ${timelineMetric==="messages"?"bg-white/20":"bg-white/10"}`}>Messages</button>
                  <button onClick={()=>setTimelineMetric("words")} className={`px-3 py-1 rounded-full ${timelineMetric==="words"?"bg-white/20":"bg-white/10"}`}>Words</button>
                  <label className="flex items-center text-sm ml-auto">
                    <input type="checkbox" className="mr-1" checked={showTrend} onChange={e=>setShowTrend(e.target.checked)} />
                    Trend
                  </label>
                </div>
                <Chart option={timelineOption()} height={360} onEvents={{ datazoom: handleZoom }} />
                <ConflictTimelineStrip conflicts={allConflicts} onSelectDate={setConflictDateFilter} />
                {(!kpis || (kpis[timelineMetric==="messages"?"timeline_messages":"timeline_words"]||[]).length===0) && <div className="text-sm text-gray-400 mt-2">No timeline data yet.</div>}
            <div>
              <Card title="Messages vs Words per Day">
                <Chart option={messagesWordsPerDayOption()} height={260} />
              </Card>
            </div>
            <div>
              <Card title="Words per message" tooltip="Messages vs words; bubble size shows words per message">
                <Chart option={wordsPerMessageOption()} height={260} />
              </Card>
            </div>
            <div>
              <Card title="Seconds to reply" tooltip="Average time from one person's message to another's reply">
                <Chart option={replyOption()} height={260} />
                {(!kpis?.reply_simple || kpis.reply_simple.length===0) && <div className="text-sm text-gray-400 mt-2">No alternating replies detected yet.</div>}
              <Card title="Reply time distribution">
                <ReplyTimeDistribution data={kpis?.reply_pairs || []} startDate={startDate} endDate={endDate} />
              </Card>
            </div>
            <div>
              <Card title="Sender share over time">
                <SenderShareChart data={timelineData} participants={participants} colorMap={colorMap} zoomRange={zoomRange} />
                {timelineData.length === 0 && <div className="text-sm text-gray-400 mt-2">No timeline data yet.</div>}
              </Card>
            </div>
            <div id="heatmap" className="xl:col-span-3 xl:row-start-5">
              <Card title="Daily rhythm heatmap (weekday × hour)">
                <div className="flex gap-2 mb-2">
                  <button onClick={()=>setHeatPerson("All")} className={`px-3 py-1 rounded-full ${heatPerson==="All"?"bg-white/20":"bg-white/10"}`}>All</button>
                  {participants.map(p => (
                    <button key={p} onClick={()=>setHeatPerson(p)} className={`px-3 py-1 rounded-full ${heatPerson===p?"bg-white/20":"bg-white/10"}`}>{p}</button>
                  ))}
                </div>
                <DailyRhythmHeatmap
                  data={kpis.heatmap || []}
                  person={heatPerson}
                  palette={palette}
                  days={heatDays}
                  zoomRange={zoomRange}
                  startDate={startDate}
                  endDate={endDate}
                />
              </Card>
            </div>
          </section>

          <section id="conflicts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Conflicts per month" tooltip="Number of detected conflict segments each month">
                {conflictProgress && (
                  <div className="text-sm text-gray-400 mb-2">
                    Analyzing {formatNumber(conflictProgress.current)}/{formatNumber(conflictProgress.total)} segments...
                  </div>
                )}
                <Chart option={conflictBarOption()} height={260} onEvents={{ click: onConflictBarClick }} />
                {!conflictProgress && conflicts.length===0 && <div className="text-sm text-gray-400 mt-2">No conflict data yet.</div>}
              </Card>
              <Card title={selectedConflict ? `Conflicts in ${selectedConflict.month}` : "Conflict details"} tooltip="Summaries of conflicts for the selected month">
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
            <Card title="Conflict timeline" tooltip="Chronological scatter of detected conflicts">
              <Chart option={conflictTimelineOption()} height={200} />
              {!conflictProgress && conflicts.length===0 && <div className="text-sm text-gray-400 mt-2">No conflict data yet.</div>}
            </Card>
          </section>

          <section id="heatmap" className="grid grid-cols-1 gap-6">
            <Card title="Daily rhythm heatmap (weekday × hour)" tooltip="Message volume by weekday and hour">
              <div className="flex gap-2 mb-2">
                <button onClick={()=>setHeatPerson("All")} className={`px-3 py-1 rounded-full ${heatPerson==="All"?"bg-white/20":"bg-white/10"}`}>All</button>
                {participants.map(p => (
                  <button key={p} onClick={()=>setHeatPerson(p)} className={`px-3 py-1 rounded-full ${heatPerson===p?"bg-white/20":"bg-white/10"}`}>{p}</button>
                ))}
            <div className="grid grid-cols-1 lg:grid-cols-6 lg:grid-rows-6">
              <div className="lg:col-start-2 lg:col-span-5 lg:row-start-6">
                <Card title="Conflicts">
                  <ConflictCardList conflicts={allConflicts} filterDate={conflictDateFilter} />
                </Card>
              </div>
            </div>
          </section>

          <section id="wordcloud" className="grid grid-cols-1 gap-6">
            <Card title="Word cloud by participant" tooltip="Most frequent words or emojis for each participant">
              <div className="mb-2 flex flex-wrap gap-3">
                {wordCategories.map(cat => (
                  <label key={cat} className="text-xs flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={wordFilters.includes(cat)}
                      onChange={() =>
                        setWordFilters(prev =>
                          prev.includes(cat)
                            ? prev.filter(c => c !== cat)
                            : [...prev, cat]
                        )
                      }
                    />
                    {cat}
                  </label>
                ))}
              </div>
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
          </section>

          <section id="extras" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              title="Questions (total & per person)"
              tooltip="Questions are messages that end with a '?' or start with words like 'who' or 'why'. Marked as unanswered if no one else replies within 15 minutes."
            >
              <div className="text-3xl">{formatNumber(kpis.questions.total)}</div>
              <div className="text-sm text-gray-300">Unanswered within 15m: {formatNumber(kpis.questions.unanswered_15m)}</div>
              {cardSplit("questions")}
              <div className="mt-1 text-sm text-gray-300">Unanswered per person:</div>
              {cardSplit("unanswered")}
            </Card>
            <Card
              title="Attachments (total & per person)"
              tooltip="Counts messages that include media or file attachments such as photos, videos, audio, or documents."
            >
              <div className="text-3xl">{formatNumber(kpis.media_total)}</div>
              {cardSplit("attachments")}
            </Card>
            <Card
              title="Affection markers (total & per person)"
              tooltip="Messages containing affectionate words or emojis like 'love you', '😘', or '❤️'."
            >
              <div className="text-3xl">{formatNumber(kpis.affection_hits)}</div>
              {cardSplit("affection")}
            </Card>
          </section>
          </>
        )}
        <div className="text-xs text-gray-400">v0.2.9 — visual refinements • API v{apiVersion}</div>
    </>
    </DateRangeContext.Provider>
  );
}
