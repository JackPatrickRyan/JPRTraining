"use client";

import { useState } from "react";
import SyncButton from "./SyncButton";
import SettingsModal from "./SettingsModal";

export default function HeaderControls() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center px-2 py-1.5 text-xs rounded border border-border text-text-muted hover:border-text-muted hover:text-text-primary transition-colors font-mono tracking-wider"
          title="Settings"
        >
          ⚙
        </button>
        <SyncButton />
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
