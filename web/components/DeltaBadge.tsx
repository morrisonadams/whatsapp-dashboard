import React from "react";

export default function DeltaBadge({ value }: { value: number }) {
  const color = value > 0 ? "text-green-400" : value < 0 ? "text-red-400" : "text-gray-400";
  const sign = value > 0 ? "+" : "";
  return <span className={`text-xs ${color}`}>{sign}{value.toLocaleString()}</span>;
}
