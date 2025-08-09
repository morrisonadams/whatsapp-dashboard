import { ReactNode } from "react";

export default function Card({ title, children, tooltip }: { title: string; children: ReactNode; tooltip?: string }) {
  return (
    <div
      className="rounded-xl bg-white/5 border border-white/10 p-6 shadow-md backdrop-blur"
      title={tooltip}
    >
      <h2 className="text-sm font-semibold text-gray-200 mb-4">{title}</h2>
      <div>{children}</div>
    </div>
  );
}
