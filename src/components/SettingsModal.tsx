"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Settings = {
  cycleFTP: number;
  runThresholdPace: number;
  swimCSS: number;
  restingHR: number;
  maxHR: number;
};

function secsToMMSS(secs: number): { m: string; s: string } {
  return {
    m: String(Math.floor(secs / 60)),
    s: String(secs % 60).padStart(2, "0"),
  };
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [ftp, setFtp] = useState("");
  const [runM, setRunM] = useState("");
  const [runS, setRunS] = useState("");
  const [swimM, setSwimM] = useState("");
  const [swimS, setSwimS] = useState("");
  const [restingHR, setRestingHR] = useState("");
  const [maxHR, setMaxHR] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        setFtp(String(s.cycleFTP));
        const run = secsToMMSS(s.runThresholdPace);
        setRunM(run.m); setRunS(run.s);
        const swim = secsToMMSS(s.swimCSS);
        setSwimM(swim.m); setSwimS(swim.s);
        setRestingHR(String(s.restingHR));
        setMaxHR(String(s.maxHR));
      })
      .catch(() => setError("Failed to load settings"));
  }, []);

  async function handleSave() {
    const ftpVal = parseInt(ftp);
    const runSecs = parseInt(runM) * 60 + parseInt(runS);
    const swimSecs = parseInt(swimM) * 60 + parseInt(swimS);
    const restVal = parseInt(restingHR);
    const maxVal = parseInt(maxHR);

    if (isNaN(ftpVal) || ftpVal <= 0) { setError("FTP must be a positive number"); return; }
    if (isNaN(runSecs) || runSecs <= 0) { setError("Run threshold pace is invalid"); return; }
    if (isNaN(swimSecs) || swimSecs <= 0) { setError("Swim CSS is invalid"); return; }
    if (parseInt(runS) > 59 || parseInt(swimS) > 59) { setError("Seconds must be 0–59"); return; }
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
        window.dispatchEvent(new Event("settings-saved"));
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

  const modal = (
    <div
      className="fixed top-0 left-0 w-screen h-screen z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg border border-border rounded-lg w-full max-w-sm flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <h2 className="font-mono text-xs tracking-[0.2em] uppercase text-text-muted">
            Threshold Settings
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto px-6 pb-2 space-y-3">
          <Field label="Bike FTP" unit="watts">
            <input
              type="number"
              value={ftp}
              onChange={(e) => setFtp(e.target.value)}
              className="w-full bg-transparent border border-border rounded px-3 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:border-ctl"
            />
          </Field>

          <Field label="Run Threshold Pace" unit="/km">
            <PaceInput m={runM} s={runS} onChangeM={setRunM} onChangeS={setRunS} />
          </Field>

          <Field label="Swim CSS" unit="/100m">
            <PaceInput m={swimM} s={swimS} onChangeM={setSwimM} onChangeS={setSwimS} />
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

          {error && <p className="text-xs font-mono text-atl">{error}</p>}
        </div>

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

  return createPortal(modal, document.body);
}

function PaceInput({
  m, s, onChangeM, onChangeS,
}: {
  m: string; s: string;
  onChangeM: (v: string) => void;
  onChangeS: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={m}
        onChange={(e) => onChangeM(e.target.value)}
        placeholder="4"
        min="0"
        className="w-16 bg-transparent border border-border rounded px-3 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:border-ctl text-center"
      />
      <span className="text-text-muted font-mono text-sm">:</span>
      <input
        type="number"
        value={s}
        onChange={(e) => onChangeS(e.target.value)}
        placeholder="30"
        min="0"
        max="59"
        className="w-16 bg-transparent border border-border rounded px-3 py-1.5 text-sm font-mono text-text-primary focus:outline-none focus:border-ctl text-center"
      />
      <span className="text-[10px] font-mono text-text-muted opacity-60 ml-1">min : sec</span>
    </div>
  );
}

function Field({
  label, unit, children,
}: {
  label: string; unit: string; children: React.ReactNode;
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
