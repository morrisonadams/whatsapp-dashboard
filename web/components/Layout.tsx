import Head from "next/head";

import { ReactNode, useEffect, useState } from "react";

import { KEYCAP_THEME_NAMES, KEYCAP_THEMES } from "@/lib/keycapThemes";
import Sidebar from "@/components/Sidebar";
import SmokeyBackground from "@/components/SmokeyBackground";



export default function Layout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(KEYCAP_THEME_NAMES[0]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("theme");
    if (saved && KEYCAP_THEMES[saved]) setTheme(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = KEYCAP_THEMES[theme];
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
      <div className="min-h-screen relative bg-bg text-text">

        <SmokeyBackground />

        <header
          className="relative z-10 border-b bg-sub-alt border-sub"
        >
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-main">
              WhatsApp Relationship Analytics
            </h1>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="text-sm rounded px-2 py-1 bg-sub-alt text-text border border-sub"
            >
              {KEYCAP_THEME_NAMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </header>
        <div className="flex relative z-10">
          <Sidebar />
          <main className="flex-1 p-6 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
