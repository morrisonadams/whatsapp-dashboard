import { useState } from "react";
import type { ConflictItem } from "./ConflictCardList";

export default function ConflictTimelineStrip({ conflicts, onSelectDate }: { conflicts: ConflictItem[]; onSelectDate: (date: string | null) => void; }) {
  const [selected, setSelected] = useState<string | null>(null);
  const sorted = conflicts.slice().sort((a, b) => a.date.localeCompare(b.date));

  const handleClick = (date: string) => {
    const newDate = selected === date ? null : date;
    setSelected(newDate);
    onSelectDate(newDate);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {sorted.map((c, idx) => (
        <button
          key={idx}
          title={c.date}
          onClick={() => handleClick(c.date)}
          className={`flex-shrink-0 rounded-full ${selected === c.date ? "ring-2 ring-main" : ""}`}
          style={{
            width: 8 + (c.severity || 1) * 4,
            height: 8 + (c.severity || 1) * 4,
            backgroundColor: severityColor(c.severity)
          }}
        />
      ))}
    </div>
  );
}

function severityColor(sev?: number) {
  if (!sev) return "#6b7280";
  if (sev >= 4) return "#ef4444";
  if (sev === 3) return "#f97316";
  if (sev === 2) return "#eab308";
  return "#22c55e";
}
