import { ReactNode } from "react";

export default function Card({ title, children, tooltip }: { title: string; children: ReactNode; tooltip?: string }) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-4 shadow-sm" title={tooltip}>
      <div className="text-sm text-gray-300 mb-2">{title}</div>
      <div>{children}</div>
    </div>
  );
}
