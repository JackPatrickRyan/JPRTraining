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

function addMetricRow(widget, label, value, color) {
  let stack = widget.addStack()
  stack.layoutHorizontally()
  stack.centerAlignContent()

  let lbl = stack.addText(label)
  lbl.font = Font.semiboldSystemFont(10)
  lbl.textColor = new Color("#71717a")
  lbl.minimumScaleFactor = 0.8

  stack.addSpacer(4)

  let val = stack.addText(value)
  val.font = new Font("Menlo-Bold", 18)
  val.textColor = color
  val.minimumScaleFactor = 0.8
}

let widget = new ListWidget()
widget.backgroundColor = new Color("#0a0a0f")
widget.setPadding(10, 12, 10, 12)

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

let title = widget.addText("Training Load")
title.font = Font.boldSystemFont(11)
title.textColor = new Color("#71717a")

widget.addSpacer(6)

addMetricRow(widget, "CTL", String(data.ctl), new Color("#3b82f6"))
widget.addSpacer(2)
addMetricRow(widget, "ATL", String(data.atl), new Color("#a855f7"))
widget.addSpacer(2)
addMetricRow(widget, "TSB", (data.tsb > 0 ? "+" : "") + String(data.tsb), tsbColor(data.tsb))

widget.addSpacer(6)

let footer = widget.addText(`${data.weekTSS} TSS · ${data.weekTime}`)
footer.font = Font.systemFont(10)
footer.textColor = new Color("#52525b")
footer.minimumScaleFactor = 0.7

if (data.lastSync) {
  widget.addSpacer(2)
  let d = new Date(data.lastSync)
  let synced = widget.addText(`↑ ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`)
  synced.font = Font.systemFont(9)
  synced.textColor = new Color("#3f3f46")
}

Script.setWidget(widget)
Script.complete()
