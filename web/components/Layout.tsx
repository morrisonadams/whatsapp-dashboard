import Head from "next/head";

import { ReactNode, useEffect, useState } from "react";
import { MONKEYTYPE_THEMES } from "@/lib/monkeytypeThemes";


export default function Layout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("gruvbox_dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const linkId = "theme-style";
    const href = `https://cdn.jsdelivr.net/gh/monkeytypegame/monkeytype/frontend/static/themes/${theme}.css`;
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
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
              {MONKEYTYPE_THEMES.map((t) => (
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
