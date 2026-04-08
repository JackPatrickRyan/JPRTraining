"use client";

import { useEffect, useState } from "react";

type Settings = {
  cycleFTP: number;
  runThresholdPace: number;
  swimCSS: number;
  restingHR: number;
  maxHR: number;
};

function secsToMMSS(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function mmssToSecs(str: string): number | null {
  const match = str.match(/^(\d+):([0-5]\d)$/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [ftp, setFtp] = useState("");
  const [runPace, setRunPace] = useState("");
  const [swimCSS, setSwimCSS] = useState("");
  const [restingHR, setRestingHR] = useState("");
  const [maxHR, setMaxHR] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        setFtp(String(s.cycleFTP));
        setRunPace(secsToMMSS(s.runThresholdPace));
        setSwimCSS(secsToMMSS(s.swimCSS));
        setRestingHR(String(s.restingHR));
        setMaxHR(String(s.maxHR));
      });
  }, []);

  async function handleSave() {
    const runSecs = mmssToSecs(runPace);
    const swimSecs = mmssToSecs(swimCSS);

    if (!runSecs) { setError("Run pace must be mm:ss (e.g. 4:30)"); return; }
    if (!swimSecs) { setError("Swim CSS must be mm:ss (e.g. 1:35)"); return; }

    setSaving(true);
    setError("");

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cycleFTP: parseInt(ftp),
        runThresholdPace: runSecs,
        swimCSS: swimSecs,
        restingHR: parseInt(restingHR),
        maxHR: parseInt(maxHR),
      }),
    });

    setSaving(false);
    if (res.ok) {
      onClose();
    } else {
      setError("Failed to save settings");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-bg border border-border rounded-lg w-full max-w-sm mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-text-muted">
            Threshold Settings
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg leading-none">×</button>
        </div>

        <div className="space-y-3">
          <Field label="Bike FTP" unit="watts">
            <input
              type="number"
              value={ftp}
              onChange={(e) => setFtp(e.target.value)}
              className="w-full bg-transparent border border-border rounded px-3 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:border-ctl"
            />
          </Field>

          <Field label="Run Threshold Pace" unit="mm:ss /km">
            <input
              type="text"
              value={runPace}
              onChange={(e) => setRunPace(e.target.value)}
              placeholder="4:30"
              className="w-full bg-transparent border border-border rounded px-3 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:border-ctl"
            />
          </Field>

          <Field label="Swim CSS" unit="mm:ss /100m">
            <input
              type="text"
              value={swimCSS}
              onChange={(e) => setSwimCSS(e.target.value)}
              placeholder="1:35"
              className="w-full bg-transparent border border-border rounded px-3 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:border-ctl"
            />
          </Field>

          <Field label="Resting HR" unit="bpm">
            <input
              type="number"
              value={restingHR}
              onChange={(e) => setRestingHR(e.target.value)}
              className="w-full bg-transparent border border-border rounded px-3 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:border-ctl"
            />
          </Field>

          <Field label="Max HR" unit="bpm">
            <input
              type="number"
              value={maxHR}
              onChange={(e) => setMaxHR(e.target.value)}
              className="w-full bg-transparent border border-border rounded px-3 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:border-ctl"
            />
          </Field>
        </div>

        {error && (
          <p className="text-xs font-mono text-atl">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono tracking-wider border border-border rounded text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-mono tracking-wider border border-ctl rounded text-ctl hover:bg-ctl hover:text-bg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & Recalculate"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  unit,
  children,
}: {
  label: string;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-text-muted">{label}</label>
        <span className="text-[10px] font-mono text-text-muted opacity-60">{unit}</span>
      </div>
      {children}
    </div>
  );
}
