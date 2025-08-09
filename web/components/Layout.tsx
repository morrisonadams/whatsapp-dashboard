import Head from "next/head";
import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        <title>WhatsApp Relationship Analytics</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-violet-900 to-slate-900 text-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="border-b border-white/10 bg-white/5 backdrop-blur">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-semibold">WhatsApp Relationship Analytics</h1>
            </div>
          </header>
          <main className="flex-1 p-6 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
