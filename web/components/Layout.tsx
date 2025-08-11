import Head from "next/head";

import { ReactNode } from "react";

import Sidebar from "@/components/Sidebar";
import SmokeyBackground from "@/components/SmokeyBackground";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        <title>WhatsApp Relationship Analytics</title>
      </Head>
      <div className="min-h-screen relative bg-bg text-text">

        <SmokeyBackground />

        <header className="relative z-10 border-b bg-sub-alt border-sub">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-main">
              WhatsApp Relationship Analytics
            </h1>
          </div>
        </header>
        <div className="flex relative z-10">
          <Sidebar />
          <main className="flex-1 p-6 grid grid-cols-12 gap-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
