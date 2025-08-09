import { ReactNode } from "react";

export default function Card({ title, children, tooltip }: { title: string; children: ReactNode; tooltip?: string }) {
  return (
    <div
      className="rounded-xl border p-6 shadow-md backdrop-blur"
      title={tooltip}
      style={{ backgroundColor: "var(--sub-alt-color)", borderColor: "var(--sub-color)" }}
    >
      <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--sub-color)" }}>
        {title}
      </h2>
      <div>{children}</div>
    </div>
  );
}
