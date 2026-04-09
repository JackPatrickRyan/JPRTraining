"use client";

import { useState } from "react";

type Props = {
  nextRaceName: string | null;
  nextRaceDate: string | null;
  onSaved: () => void;
};

function daysUntil(dateStr: string): number {
  const race = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  race.setHours(0, 0, 0, 0);
  return Math.round((race.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function NextRaceCard({ nextRaceName, nextRaceDate, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(nextRaceName ?? "");
  const [date, setDate] = useState(
    nextRaceDate ? nextRaceDate.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  const days = nextRaceDate ? daysUntil(nextRaceDate) : null;
  const color = days === null ? "#6b7280" : days <= 14 ? "#f472b6" : days <= 42 ? "#f59e0b" : "#3b82f6";

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextRaceName: name || null, nextRaceDate: date || null }),
    });
    setSaving(false);
    setEditing(false);
    window.dispatchEvent(new Event("settings-saved"));
    onSaved();
  }

  function cancel() {
    setName(nextRaceName ?? "");
    setDate(nextRaceDate ? nextRaceDate.slice(0, 10) : "");
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted">
          Next Race
        </span>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Race name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-blue-500"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono py-2 rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={cancel}
            className="flex-1 border border-border hover:border-text-muted text-text-muted text-xs font-mono py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3 cursor-pointer hover:border-text-muted transition-colors"
      onClick={() => setEditing(true)}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted">
          Next Race
        </span>
        <span className="text-xs text-text-muted">
          {nextRaceName ?? "Click to add"}
        </span>
      </div>
      {days !== null ? (
        <div className="font-numeric text-5xl font-light leading-none" style={{ color }}>
          {days}
          <span className="text-lg font-mono text-text-muted ml-2">days</span>
        </div>
      ) : (
        <div className="font-numeric text-5xl font-light leading-none text-text-muted">
          —
        </div>
      )}
      {nextRaceDate && (
        <div className="text-xs text-text-muted font-mono">
          {new Date(nextRaceDate).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      )}
    </div>
  );
}
