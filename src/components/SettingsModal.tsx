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
  const match = str.trim().match(/^(\d+):([0-5]\d)$/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [ftp, setFtp] = useState("");
  const [runPace, setRunPace] = useState("");
  const [swimCSSStr, setSwimCSSStr] = useState("");
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
        setSwimCSSStr(secsToMMSS(s.swimCSS));
        setRestingHR(String(s.restingHR));
        setMaxHR(String(s.maxHR));
      })
      .catch(() => setError("Failed to load settings"));
  }, []);

  async function handleSave() {
    const runSecs = mmssToSecs(runPace);
    const swimSecs = mmssToSecs(swimCSSStr);

    if (!runSecs) { setError("Run pace must be mm:ss (e.g. 4:30)"); return; }
    if (!swimSecs) { setError("Swim CSS must be mm:ss (e.g. 1:35)"); return; }

    const ftpVal = parseInt(ftp);
    const restVal = parseInt(restingHR);
    const maxVal = parseInt(maxHR);

    if (isNaN(ftpVal) || ftpVal <= 0) { setError("FTP must be a positive number"); return; }
    if (isNaN(restVal) || restVal <= 0) { setError("Resting HR must be a positive number"); return; }
    if (isNaN(maxVal) || maxVal <= 0) { setError("Max HR must be a positive number"); return; }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleFTP: ftpVal,
          runThresholdPace: runSecs,
          swimCSS: swimSecs,
          restingHR: restVal,
          maxHR: maxVal,
        }),
      });

      if (res.ok) {
        onClose();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? `Save failed (${res.status})`);
      }
    } catch {
      setError("Network error — check console");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg border border-border rounded-lg w-full max-w-sm flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-text-muted">
            Threshold Settings
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-2 space-y-3">
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
              value={swimCSSStr}
              onChange={(e) => setSwimCSSStr(e.target.value)}
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

          {error && (
            <p className="text-xs font-mono text-atl">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 shrink-0 border-t border-border mt-2">
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
