import { useState } from "react";

export interface ConflictItem {
  date: string;
  tags?: string[];
  severity?: number;
  summary?: string;
  details?: string;
}

export default function ConflictCardList({ conflicts, filterDate }: { conflicts: ConflictItem[]; filterDate: string | null; }) {
  const [open, setOpen] = useState<number | null>(null);
  const items = filterDate ? conflicts.filter(c => c.date === filterDate) : conflicts;

  if (!items.length) {
    return <div className="text-sm text-gray-400">No conflicts for selected period.</div>;
  }

  return (
    <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
      {items.map((c, idx) => {
        const expanded = open === idx;
        return (
          <div key={idx} className="bg-sub-alt rounded p-3">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setOpen(expanded ? null : idx)}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{c.date}</span>
                <div className="flex flex-wrap gap-1">
                  {(c.tags || []).map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded bg-white/10">{t}</span>
                  ))}
                </div>
              </div>
              <span
                className="rounded-full flex-shrink-0"
                style={{
                  width: 8 + (c.severity || 1) * 4,
                  height: 8 + (c.severity || 1) * 4,
                  backgroundColor: severityColor(c.severity)
                }}
              />
            </div>
            {expanded && (
              <div className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
                {c.details || c.summary}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function severityColor(sev?: number) {
  if (!sev) return "#6b7280"; // gray-500
  if (sev >= 4) return "#ef4444"; // red-500
  if (sev === 3) return "#f97316"; // orange-500
  if (sev === 2) return "#eab308"; // yellow-500
  return "#22c55e"; // green-500
}
