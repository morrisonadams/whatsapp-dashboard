import { ReactNode } from "react";
export default function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-4 shadow-sm">
      <div className="text-sm text-gray-300 mb-2">{title}</div>
      <div>{children}</div>
    </div>
  );
}
