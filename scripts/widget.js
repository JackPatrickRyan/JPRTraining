// Variables used by Scriptable.
// icon-color: blue; icon-glyph: activity

const API_URL = "https://jpr-training.vercel.app/api/widget"
const API_KEY = "e654e74259c8f7ce0a4dce9096042c98f5a3287a2a18f96bad55c924e2a7dc3c"

// ── Palette — mirrors globals.css design tokens ───────────────────────────────
const C = {
  bg:       new Color("#0a0a0f"),
  surface:  new Color("#12121a"),
  text:     new Color("#e4e4e7"),
  muted:    new Color("#71717a"),
  dim:      new Color("#3f3f46"),
  ctl:      new Color("#3b82f6"),
  atl:      new Color("#f472b6"),
  tsbFresh: new Color("#22c55e"),
  tsbTired: new Color("#ef4444"),
}

function tsbColor(tsb) {
  return tsb >= 0 ? C.tsbFresh : C.tsbTired
}

function raceColor(days) {
  if (days <= 14) return new Color("#f472b6")
  if (days <= 42) return new Color("#f59e0b")
  return new Color("#3b82f6")
}

async function fetchData() {
  let req = new Request(API_URL)
  req.headers = { "Authorization": `Bearer ${API_KEY}` }
  return req.loadJSON()
}

// ── Widget scaffold ───────────────────────────────────────────────────────────
let widget = new ListWidget()
widget.backgroundColor = C.bg
widget.setPadding(10, 10, 10, 10)

let data
try {
  data = await fetchData()
} catch (e) {
  let err = widget.addText("Failed to load")
  err.font = Font.systemFont(12)
  err.textColor = Color.red()
  Script.setWidget(widget)
  Script.complete()
  return
}

if (data.error) {
  let err = widget.addText(data.error)
  err.font = Font.systemFont(12)
  err.textColor = Color.red()
  Script.setWidget(widget)
  Script.complete()
  return
}

// ── Card builder ──────────────────────────────────────────────────────────────
// Mirrors the dashboard card: bg-surface border rounded-xl p-5
// label = top-left mono uppercase  |  sublabel = top-right muted
// value = large mono number in accent colour
function addCard(parent, label, sublabel, valueStr, valueColor) {
  let card = parent.addStack()
  card.layoutVertically()
  card.backgroundColor = C.surface
  card.cornerRadius = 10
  card.setPadding(7, 9, 7, 9)

  // Header: LABEL (left) · sublabel (right)
  let header = card.addStack()
  header.layoutHorizontally()
  let lbl = header.addText(label)
  lbl.font = new Font("Menlo-Bold", 7)
  lbl.textColor = C.muted
  header.addSpacer()
  if (sublabel) {
    let sub = header.addText(sublabel)
    sub.font = Font.systemFont(7)
    sub.textColor = C.muted
    sub.lineLimit = 1
    sub.minimumScaleFactor = 0.7
  }

  card.addSpacer(5)

  // Value
  let val = card.addText(valueStr)
  val.font = new Font("Menlo-Regular", 22)
  val.textColor = valueColor
  val.minimumScaleFactor = 0.55
  val.lineLimit = 1
}

// ── Row 1: CTL | ATL | TSB ───────────────────────────────────────────────────
let row1 = widget.addStack()
row1.layoutHorizontally()
row1.spacing = 5

const tsbVal  = data.tsb
const tsbStr  = (tsbVal > 0 ? "+" : "") + String(Math.round(tsbVal))

addCard(row1, "CTL", "Fitness", String(Math.round(data.ctl)), C.ctl)
addCard(row1, "ATL", "Fatigue", String(Math.round(data.atl)), C.atl)
addCard(row1, "TSB", "Form",    tsbStr,                       tsbColor(tsbVal))

widget.addSpacer(5)

// ── Row 2: TSS | Time | Race ─────────────────────────────────────────────────
let row2 = widget.addStack()
row2.layoutHorizontally()
row2.spacing = 5

addCard(row2, "THIS WEEK", "TSS",  String(data.weekTSS), C.text)
addCard(row2, "THIS WEEK", "Time", data.weekTime,        C.muted)

if (data.daysToRace !== null && data.daysToRace !== undefined) {
  const raceName = data.raceName || "Race"
  const daysStr  = data.daysToRace + " d"
  addCard(row2, "RACE", raceName, daysStr, raceColor(data.daysToRace))
}

// ── Sync footer ───────────────────────────────────────────────────────────────
if (data.lastSync) {
  widget.addSpacer(4)
  let syncStack = widget.addStack()
  syncStack.layoutHorizontally()
  syncStack.addSpacer()
  let d = new Date(data.lastSync)
  let synced = syncStack.addText(
    `↑ ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
  )
  synced.font = Font.systemFont(8)
  synced.textColor = C.dim
  syncStack.addSpacer()
}

Script.setWidget(widget)
Script.complete()
