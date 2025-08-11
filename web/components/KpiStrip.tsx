import KpiCard from "@/components/KpiCard";

interface Props {
  kpis: any;
  startDate?: string;
  endDate?: string;
}

function dateFilter(day: string, start?: string, end?: string) {
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

function aggregate(tl: any[], key: string, start?: string, end?: string) {
  const map: Record<string, number> = {};
  tl.filter((r: any) => dateFilter(r.day, start, end)).forEach((r: any) => {
    map[r.day] = (map[r.day] || 0) + r[key];
  });
  const days = Object.keys(map).sort();
  return { days, values: days.map((d) => map[d]) };
}

function prevSum(tl: any[], key: string, firstDay: string, len: number) {
  const prevEnd = new Date(firstDay);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(firstDay);
  prevStart.setDate(prevStart.getDate() - len);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const s = fmt(prevStart);
  const e = fmt(prevEnd);
  const map: Record<string, number> = {};
  tl.filter((r: any) => r.day >= s && r.day <= e).forEach((r: any) => {
    map[r.day] = (map[r.day] || 0) + r[key];
  });
  return Object.values(map).reduce((a, b) => a + b, 0);
}

export default function KpiStrip({ kpis, startDate, endDate }: Props) {
  const msgAgg = aggregate(kpis.timeline_messages || [], "messages", startDate, endDate);
  const wordAgg = aggregate(kpis.timeline_words || [], "words", startDate, endDate);

  const totalMessages = msgAgg.values.reduce((s, n) => s + n, 0);
  const totalWords = wordAgg.values.reduce((s, n) => s + n, 0);

  const prevMessages = msgAgg.days.length
    ? prevSum(kpis.timeline_messages || [], "messages", msgAgg.days[0], msgAgg.days.length)
    : 0;
  const prevWords = wordAgg.days.length
    ? prevSum(kpis.timeline_words || [], "words", wordAgg.days[0], wordAgg.days.length)
    : 0;

  const wordMap: Record<string, number> = {};
  wordAgg.days.forEach((d, i) => {
    wordMap[d] = wordAgg.values[i];
  });

  const delta = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);

  const perK = (count: number, words = totalWords) =>
    words > 0 ? count / (words / 1000) : 0;

  const qAgg = aggregate(kpis.timeline_questions || [], "questions", startDate, endDate);
  const totalQuestions = qAgg.values.reduce((s, n) => s + n, 0);
  const prevQuestions = qAgg.days.length
    ? prevSum(kpis.timeline_questions || [], "questions", qAgg.days[0], qAgg.days.length)
    : 0;
  const qTrend = wordAgg.days.map((d) => {
    const idx = qAgg.days.indexOf(d);
    const cnt = idx >= 0 ? qAgg.values[idx] : 0;
    return perK(cnt, wordMap[d] || 0);
  });

  const mediaAgg = aggregate(kpis.timeline_media || [], "media", startDate, endDate);
  const totalMedia = mediaAgg.values.reduce((s, n) => s + n, 0);
  const prevMedia = mediaAgg.days.length
    ? prevSum(kpis.timeline_media || [], "media", mediaAgg.days[0], mediaAgg.days.length)
    : 0;
  const mediaTrend = wordAgg.days.map((d) => {
    const idx = mediaAgg.days.indexOf(d);
    const cnt = idx >= 0 ? mediaAgg.values[idx] : 0;
    return perK(cnt, wordMap[d] || 0);
  });

  const affAgg = aggregate(kpis.timeline_affection || [], "affection", startDate, endDate);
  const totalAff = affAgg.values.reduce((s, n) => s + n, 0);
  const prevAff = affAgg.days.length
    ? prevSum(kpis.timeline_affection || [], "affection", affAgg.days[0], affAgg.days.length)
    : 0;
  const affTrend = wordAgg.days.map((d) => {
    const idx = affAgg.days.indexOf(d);
    const cnt = idx >= 0 ? affAgg.values[idx] : 0;
    return perK(cnt, wordMap[d] || 0);
  });

  const profAgg = aggregate(kpis.timeline_profanity || [], "profanity", startDate, endDate);
  const totalProf = profAgg.values.reduce((s, n) => s + n, 0);
  const prevProf = profAgg.days.length
    ? prevSum(kpis.timeline_profanity || [], "profanity", profAgg.days[0], profAgg.days.length)
    : 0;
  const profTrend = wordAgg.days.map((d) => {
    const idx = profAgg.days.indexOf(d);
    const cnt = idx >= 0 ? profAgg.values[idx] : 0;
    return perK(cnt, wordMap[d] || 0);
  });

  const weRatio = kpis.we_ness_ratio || 0;
  const wePrev = kpis.prev_we_ness_ratio;

  const metrics = [
    {
      title: "Messages",
      value: totalMessages,
      trend: msgAgg.values,
      delta: delta(totalMessages, prevMessages),
      tooltip: "Total messages in range",
    },
    {
      title: "Words",
      value: totalWords,
      trend: wordAgg.values,
      delta: delta(totalWords, prevWords),
      tooltip: "Total words in range",
    },
    {
      title: "We-ness ratio",
      value: weRatio,
      trend: wordAgg.values.map(() => weRatio),
      delta: wePrev !== undefined ? delta(weRatio, wePrev) : undefined,
      tooltip: "Share of 'we/us/our' vs 'I/me/my'",
    },
    {
      title: "Questions/1k words",
      value: perK(totalQuestions),
      trend: qTrend,
      delta: delta(perK(totalQuestions), perK(prevQuestions, prevWords)),
      tooltip: "Questions per thousand words",
    },
    {
      title: "Attachments/1k words",
      value: perK(totalMedia),
      trend: mediaTrend,
      delta: delta(perK(totalMedia), perK(prevMedia, prevWords)),
      tooltip: "Messages with media or files per 1k words",
    },
    {
      title: "Affection/1k words",
      value: perK(totalAff),
      trend: affTrend,
      delta: delta(perK(totalAff), perK(prevAff, prevWords)),
      tooltip: "Affectionate terms per 1k words",
    },
    {
      title: "Profanity/1k words",
      value: perK(totalProf),
      trend: profTrend,
      delta: delta(perK(totalProf), perK(prevProf, prevWords)),
      tooltip: "Profanity hits per 1k words",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mt-4">
      {metrics.map((m) => (
        <KpiCard key={m.title} {...m} />
      ))}
    </div>
  );
}
