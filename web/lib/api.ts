export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function getKPIs() {
  const res = await fetch(`${API_BASE}/kpis`);
  if (!res.ok) throw new Error("No KPIs yet, upload a chat export");
  const data = await res.json();
  return data.kpis;
}

export async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.kpis;
}

export async function getConflicts(
  onProgress?: (current: number, total: number) => void
) {
  return new Promise<any[]>((resolve, reject) => {
    const es = new EventSource(`${API_BASE}/conflicts_stream`);
    const periods: any[] = [];

    const aggregate = (per: any[]) => {
      const months: Record<string, {month: string; total_conflicts: number; conflicts: any[]}> = {};
      for (const p of per) {
        const start = new Date(p.period.split("/")[0]);
        const monthKey = start.toISOString().slice(0,7);
        if (!months[monthKey]) {
          months[monthKey] = {month: monthKey, total_conflicts: 0, conflicts: []};
        }
        for (const c of (p.conflicts || [])) {
          months[monthKey].conflicts.push(c);
          months[monthKey].total_conflicts += 1;
        }
      }
      return Object.values(months).sort((a,b)=>a.month.localeCompare(b.month));
    };

    es.onmessage = (ev) => {
      if (ev.data === "[DONE]") {
        es.close();
        resolve(aggregate(periods));
        return;
      }
      try {
        const msg = JSON.parse(ev.data);
        if (msg.current && msg.total && onProgress) {
          onProgress(msg.current, msg.total);
        }
        if (msg.period) periods.push(msg.period);
      } catch {
        // ignore malformed messages
      }
    };
    es.onerror = () => {
      es.close();
      reject(new Error("Failed to stream conflicts"));
    };
  });
}
