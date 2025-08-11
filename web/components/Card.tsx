import { ReactNode } from "react";

export default function Card({ title, children, tooltip }: { title: string; children: ReactNode; tooltip?: string }) {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/10 p-6 shadow-md backdrop-blur-md"
      title={tooltip}
    >
      <h2 className="text-sm font-semibold mb-4 text-sub">
        {title}
      </h2>
      <div>{children}</div>
    </div>
  );
}
