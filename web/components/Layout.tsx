import Head from "next/head";

import { ReactNode, useEffect, useState } from "react";
import { VIM_THEME_NAMES, VIM_THEMES } from "@/lib/vimThemes";


export default function Layout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("gruvbox_dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("theme");
    if (saved && VIM_THEMES[saved]) setTheme(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = VIM_THEMES[theme];
    const root = document.documentElement.style;
    root.setProperty("--bg-color", t.bg);
    root.setProperty("--text-color", t.text);
    root.setProperty("--sub-color", t.subtext);
    root.setProperty("--sub-alt-color", t.surfaces);
    root.setProperty("--main-color", t.main);
    localStorage.setItem("theme", theme);
    window.dispatchEvent(new Event("themechange"));
  }, [theme]);

  return (
    <>
      <Head>
        <title>WhatsApp Relationship Analytics</title>
      </Head>
      <div className="min-h-screen relative" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}>
        <div
          className="pointer-events-none fixed inset-0 bg-center bg-cover bg-fixed -z-10"
          style={{
            backgroundImage: "url('/smoke.svg')",
            backgroundColor: "var(--main-color)",
            mixBlendMode: "multiply",
            opacity: 0.15,
          }}
        ></div>
        <header
          className="border-b"
          style={{ backgroundColor: "var(--sub-alt-color)", borderColor: "var(--sub-color)" }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold" style={{ color: "var(--main-color)" }}>
              WhatsApp Relationship Analytics
            </h1>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="text-sm rounded px-2 py-1"
              style={{
                backgroundColor: "var(--sub-alt-color)",
                color: "var(--text-color)",
                border: "1px solid var(--sub-color)",
              }}
            >
              {VIM_THEME_NAMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6 space-y-6">
          {children}
        </main>
      </div>
    </>
  );
}
