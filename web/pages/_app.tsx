import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { ParticipantColorsProvider } from "@/lib/ParticipantColors";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ParticipantColorsProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ParticipantColorsProvider>
  );
}
