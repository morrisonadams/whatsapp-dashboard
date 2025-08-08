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
    const months: any[] = [];
    es.onmessage = (ev) => {
      if (ev.data === "[DONE]") {
        es.close();
        const sorted = months.sort((a, b) => a.month.localeCompare(b.month));
        resolve(sorted);
        return;
      }
      try {
        const msg = JSON.parse(ev.data);
        if (msg.current && msg.total && onProgress) {
          onProgress(msg.current, msg.total);
        }
        if (msg.month) months.push(msg.month);
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
