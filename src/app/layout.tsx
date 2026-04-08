import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SyncButton from "@/components/SyncButton";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Training Dashboard",
  description: "Personal triathlon training dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body className="h-full bg-bg text-text-primary flex flex-col">
        <header className="shrink-0 flex items-center justify-between px-6 h-12 border-b border-border">
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
            JPR Training
          </span>
          <SyncButton />
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
