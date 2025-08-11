import { useParticipantColors } from "@/lib/ParticipantColors";

export default function ColorLegend() {
  const { participants, colorMap } = useParticipantColors();
  if (!participants.length) return null;
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {participants.map((p) => (
        <span key={p} className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorMap[p] }} />
          {p}
        </span>
      ))}
    </div>
  );
}
