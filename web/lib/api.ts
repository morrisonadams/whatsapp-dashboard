export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function getKPIs() {
  const res = await fetch(`${API_BASE}/kpis`);
  if (!res.ok) throw new Error("No KPIs yet, load sample or upload");
  const data = await res.json();
  return data.kpis;
}

export async function loadSample() {
  const res = await fetch(`${API_BASE}/load_sample`);
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
