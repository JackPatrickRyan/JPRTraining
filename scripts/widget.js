// Variables used by Scriptable.
// icon-color: blue; icon-glyph: activity

const API_URL = "https://jpr-training.vercel.app/api/widget"
const API_KEY = "e654e74259c8f7ce0a4dce9096042c98f5a3287a2a18f96bad55c924e2a7dc3c"

async function fetchData() {
  let req = new Request(API_URL)
  req.headers = { "Authorization": `Bearer ${API_KEY}` }
  return req.loadJSON()
}

function tsbColor(tsb) {
  if (tsb >= 5)   return new Color("#22c55e")
  if (tsb >= -10) return new Color("#eab308")
  return new Color("#ef4444")
}

let widget = new ListWidget()
widget.backgroundColor = new Color("#0a0a0f")
widget.setPadding(12, 14, 12, 14)

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

// ── Hero row: CTL ◦ ATL ◦ TSB ───────────────────────────────────────────────

let rowWrapper = widget.addStack()
rowWrapper.layoutHorizontally()
rowWrapper.addSpacer()

let row = rowWrapper.addStack()
row.layoutHorizontally()
row.centerAlignContent()
rowWrapper.addSpacer()

function addNumber(stack, value, color) {
  let t = stack.addText(String(Math.round(value)))
  t.font = new Font("Menlo-Bold", 26)
  t.textColor = color
  t.minimumScaleFactor = 0.7
}

function addDot(stack) {
  let d = stack.addText("◦")
  d.font = Font.systemFont(14)
  d.textColor = new Color("#3f3f46")
}

addNumber(row, data.ctl, new Color("#3b82f6"))
row.addSpacer(6)
addDot(row)
row.addSpacer(6)
addNumber(row, data.atl, new Color("#f472b6"))
row.addSpacer(6)
addDot(row)
row.addSpacer(6)
addNumber(row, data.tsb, tsbColor(data.tsb))

widget.addSpacer(8)

// ── Weekly stats: TSS + time ─────────────────────────────────────────────────

let weekStack = widget.addStack()
weekStack.layoutHorizontally()
weekStack.addSpacer()
let weekText = weekStack.addText(`${data.weekTSS} TSS · ${data.weekTime}`)
weekText.font = Font.systemFont(10)
weekText.textColor = new Color("#52525b")
weekText.minimumScaleFactor = 0.7
weekStack.addSpacer()

// ── Race info ────────────────────────────────────────────────────────────────

if (data.daysToRace !== null && data.daysToRace !== undefined) {
  widget.addSpacer(2)
  let raceStack = widget.addStack()
  raceStack.layoutHorizontally()
  raceStack.addSpacer()
  const raceName = data.raceName || "Race"
  let raceText = raceStack.addText(`${raceName} · ${data.daysToRace} days`)
  raceText.font = Font.systemFont(10)
  raceText.textColor = new Color("#52525b")
  raceText.minimumScaleFactor = 0.7
  raceStack.addSpacer()
}

// ── Last sync ────────────────────────────────────────────────────────────────

if (data.lastSync) {
  widget.addSpacer(2)
  let syncStack = widget.addStack()
  syncStack.layoutHorizontally()
  syncStack.addSpacer()
  let d = new Date(data.lastSync)
  let synced = syncStack.addText(`↑ ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`)
  synced.font = Font.systemFont(9)
  synced.textColor = new Color("#3f3f46")
  syncStack.addSpacer()
}

Script.setWidget(widget)
Script.complete()
