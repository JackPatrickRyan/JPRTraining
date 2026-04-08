"use client";

import { useState } from "react";
import SyncButton from "./SyncButton";
import SettingsModal from "./SettingsModal";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="shrink-0 flex items-center justify-between px-6 h-12 border-b border-border">
        <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
          JPR Training
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center px-2 py-1.5 text-xs rounded border border-border text-text-muted hover:border-text-muted hover:text-text-primary transition-colors font-mono tracking-wider"
          >
            ⚙
          </button>
          <SyncButton />
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
