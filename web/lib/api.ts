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
        for (const c of (p.conflicts || [])) {
          const monthKey = new Date(c.date).toISOString().slice(0,7);
          if (!months[monthKey]) {
            months[monthKey] = {month: monthKey, total_conflicts: 0, conflicts: []};
          }
          months[monthKey].conflicts.push(c);
          months[monthKey].total_conflicts += 1;
        }
      }
      for (const m of Object.values(months)) {
        m.conflicts.sort((a,b)=>a.date.localeCompare(b.date));
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
        if (
          typeof msg.current === "number" &&
          typeof msg.total === "number" &&
          onProgress
        ) {
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

export async function getDailyThemes(
  onProgress?: (current: number, total: number) => void
) {
  return new Promise<any[]>((resolve, reject) => {
    const es = new EventSource(`${API_BASE}/daily_themes_stream`);
    const days: any[] = [];


    const startTimeout = () =>
      setTimeout(() => {
        es.close();
        console.error("Daily themes request timed out");
        reject(new Error("Daily themes request timed out"));
      }, 30000);

    let timeout = startTimeout();
    const reset = () => {
      clearTimeout(timeout);
      timeout = startTimeout();
    };
    const clear = () => clearTimeout(timeout);

    es.onmessage = (ev) => {
      reset();
      if (ev.data === "[DONE]") {
        clear();
        es.close();
        days.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        resolve(days);
        return;
      }
      try {
        const msg = JSON.parse(ev.data);
        if (msg.error) {
          clear();
          es.close();
          console.error("Daily themes stream returned error", msg.error);
          reject(new Error(msg.error));
          return;
        }
        if (
          typeof msg.current === "number" &&
          typeof msg.total === "number" &&
          onProgress
        ) {
          onProgress(msg.current, msg.total);
        }
        if (msg.range && Array.isArray(msg.range.days)) {
          for (const d of msg.range.days) days.push(d);
        }
      } catch {
        // ignore malformed messages
      }
    };
    es.onerror = async (ev) => {
      console.error("Daily themes stream connection error", ev);
      clear();
      es.close();
      try {
        const res = await fetch(`${API_BASE}/daily_themes`);
        const data = await res
          .json()
          .catch(async () => ({ detail: await res.text() }));
        if (!res.ok) {
          console.error("Failed to fetch daily themes after stream error", data);
          reject(new Error(data.detail || "Failed to stream daily themes"));
          return;
        }
        if (data.error) {
          console.error("Daily themes API returned error", data.error);
          reject(new Error(data.error));
          return;
        }
        resolve(data.days || []);
      } catch (err) {
        console.error("Failed to stream daily themes", err);
        reject(new Error("Failed to stream daily themes"));
      }
    };
  });
}
