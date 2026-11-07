import type { Metadata } from "next";
import { Anton, Atkinson_Hyperlegible } from "next/font/google";
import { StudioProvider } from "@/components/studio-context";
import "./globals.css";

const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Atkinson_Hyperlegible({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Mozart studio",
  description: "Write original lyrics and a Mozart sound prompt. No audio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body style={{ fontFamily: "var(--font-body), sans-serif" }}>
        <StudioProvider>{children}</StudioProvider>
      </body>
    </html>
  );
}
