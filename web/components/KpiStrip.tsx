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

  const delta = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);

  const perK = (count: number) => (totalWords > 0 ? count / (totalWords / 1000) : 0);

  const metrics = [
    {
      title: "Messages",
      value: totalMessages,
      trend: msgAgg.values,
      delta: delta(totalMessages, prevMessages),
      tooltip: "Total messages exchanged in selected date range",
    },
    {
      title: "Words",
      value: totalWords,
      trend: wordAgg.values,
      delta: delta(totalWords, prevWords),
      tooltip: "Total words sent in selected date range",
    },
    {
      title: "We-ness ratio",
      value: kpis.we_ness_ratio || 0,
      trend: wordAgg.values.map(() => kpis.we_ness_ratio || 0),
      tooltip: "Share of 'we/us/our' versus first-person pronouns",
    },
    {
      title: "Questions/1k words",
      value: perK(kpis.questions?.total || 0),
      trend: wordAgg.values.map(() => perK(kpis.questions?.total || 0)),
      tooltip: "Questions per thousand words",
    },
    {
      title: "Attachments/1k words",
      value: perK(kpis.media_total || 0),
      trend: wordAgg.values.map(() => perK(kpis.media_total || 0)),
      tooltip: "Messages with media or files per thousand words",
    },
    {
      title: "Affection/1k words",
      value: perK(kpis.affection_hits || 0),
      trend: wordAgg.values.map(() => perK(kpis.affection_hits || 0)),
      tooltip: "Affectionate words or emojis per thousand words",
    },
    {
      title: "Profanity/1k words",
      value: perK(kpis.profanity_hits || 0),
      trend: wordAgg.values.map(() => perK(kpis.profanity_hits || 0)),
      tooltip: "Common profanity per thousand words",
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
