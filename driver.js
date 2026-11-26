"use strict";
// The driver's page: my deliveries, navigate, start, share my position, add photos and videos, delivered / problem.
const app = document.getElementById("app");
let data = null, busy = false, askProblem = null;
const ups = {};          // order id -> { done, total, pct, failed } for uploads still running

async function act(o, action, arg = {}) {
  if (busy) return; busy = true; render();
  try { await rpc("driver_action", { p_order: o.id, p_action: action, p_arg: { nonce: nonce(), ...arg } }); askProblem = null; await load(); toast("Saved: " + o.order); }
  catch (e) { toast("Not saved: " + e.message, true); }
  finally { busy = false; render(); }
}

// ---- Photos and videos: as many as needed, before or after "Delivered". Photos are shrunk on the phone; videos go
// up as they are and the shop PC compresses them. Everything is filed under the order for good.
function addFiles(o, input) {
  input.onchange = async () => {
    const files = [...input.files]; input.value = "";
    if (!files.length) return;
    const u = ups[o.id] = ups[o.id] || { done: 0, total: 0, pct: 0, failed: 0 };
    u.total += files.length; render();
    for (const f of files) {
      try { await uploadMedia(o.id, f, "proof", "", p => { u.pct = p; paint(o.id); }); }
      catch (e) { u.failed++; toast(e.message, true); }
      u.done++; u.pct = 0; paint(o.id);
    }
    if (u.done >= u.total) { toast(u.failed ? `${u.total - u.failed} saved, ${u.failed} failed` : u.total > 1 ? `${u.total} files saved` : "Saved", !!u.failed); delete ups[o.id]; await load(); render(); }
  };
  input.click();
}
function paint(id) { const n = document.getElementById("up-" + id); if (n) n.replaceWith(upLine({ id })); }
function upLine(o) {
  const u = ups[o.id];
  if (!u) return el("div", { id: "up-" + o.id, class: "up" }, o.media ? `${o.media} photo${o.media > 1 ? "s / videos" : " or video"} saved for this delivery.` : null);
  return el("div", { id: "up-" + o.id, class: "up" }, `Sending ${Math.min(u.done + 1, u.total)} of ${u.total}. Keep this page open.`, el("div", { class: "bar2" }, el("i", { style: `width:${Math.round(u.pct * 100)}%` })));
}

// ---- Location sharing: only while one of MY deliveries is on its way, only while this page is open on screen.
// The customer's tracking page shows the position with the time it was last seen; the shop sees the route.
let geoWatch = null, geo = "idle", lastSent = 0, wake = null, shareOff = store.get("loop_driver_share") === "off";
const outNow = () => data ? data.mine.filter(o => o.status === "out" && o.problem !== "failed") : [];
function onPos(p) {
  const was = geo; geo = "on";
  if (was !== "on") render();
  if (p.coords.accuracy > 500 || Date.now() - lastSent < 20000) return;
  lastSent = Date.now();
  for (const o of outNow()) rpc("driver_action", { p_order: o.id, p_action: "position", p_arg: { lat: p.coords.latitude, lng: p.coords.longitude } }).catch(() => {});
}
function onPosErr(e) { geo = e.code === 1 ? "denied" : "weak"; render(); }
async function syncGeo() {
  const want = outNow().length > 0 && !shareOff && "geolocation" in navigator && document.visibilityState === "visible";
  if (want && geoWatch == null) {
    geo = "asking";
    geoWatch = navigator.geolocation.watchPosition(onPos, onPosErr, { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 });
    try { if (navigator.wakeLock) wake = await navigator.wakeLock.request("screen"); } catch (e) {}   // keep the screen on while sharing
  } else if (!want && geoWatch != null) {
    navigator.geolocation.clearWatch(geoWatch); geoWatch = null; lastSent = 0; geo = "idle";
    try { if (wake) wake.release(); } catch (e) {} wake = null;
  }
}
function setShare(on) { shareOff = !on; store.set("loop_driver_share", on ? "on" : "off"); syncGeo(); render(); }
function shareLine() {
  if (!("geolocation" in navigator)) return null;
  const link = (label, fn) => el("button", { type: "button", onclick: fn }, label);
  if (shareOff) return el("div", { class: "share off" }, el("span", {}, "Location sharing is off. The customer sees \"on its way\" with no map."), link("Turn on", () => setShare(true)));
  if (geo === "denied") return el("div", { class: "share off" }, el("span", {}, "This phone is blocking location for this page. Allow it in the browser's site settings to show the customer a map."));
  if (geo === "weak") return el("div", { class: "share off" }, el("span", {}, "Can't get a location fix right now. Still trying."), link("Stop", () => setShare(false)));
  return el("div", { class: "share" }, el("span", {}, geo === "on" ? "The customer and the shop can see where you are while this page is open." : "Getting your location…"), link("Stop sharing", () => setShare(false)));
}

const stage = o => o.status === "ready" ? "Ready to load" : o.status === "preparing" ? "Being made" : "Not started yet";
function mine(o) {
  const r = o.recipient, B = (label, fn, cls) => el("button", { class: "btn " + (cls || ""), type: "button", disabled: busy, onclick: fn }, label);
  const full = r ? [r.address, r.city, r.state, r.zip].filter(Boolean).join(", ") : "";
  const done = o.status === "delivered", out = o.status === "out", failed = o.problem === "failed";
  const files = el("div", { class: "row" }, B([icon("camera"), " Photo / video"], () => addFiles(o, document.getElementById("cam"))), B("From my phone", () => addFiles(o, document.getElementById("lib"))));
  return el("div", { class: "tk" + (done ? " done" : "") },
    el("div", { class: "top" }, el("b", {}, o.arrangement || "Order"),
      el("span", { class: "pill" + (failed ? " w" : out ? " now" : "") }, done ? "Delivered" : failed ? "Not delivered" : out ? "On your way" : stage(o))),
    el("p", { class: "sub" }, [o.order, o.due_window, o.tone === "quiet" && "Sympathy"].filter(Boolean).join(" · ")),
    !done && r && el("p", { class: "addr" }, el("b", {}, r.name || o.for || ""), el("br"), full),
    !done && !r && el("p", { class: "sub" }, "For " + (o.for || "the recipient") + ". The address is on the ticket."),
    !done && o.instructions && el("p", { class: "say" }, o.instructions),
    !done && r && el("div", { class: "row" },
      el("a", { class: "btn", href: "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(full), target: "_blank", rel: "noopener noreferrer" }, icon("pin"), " Navigate"),
      r.phone && el("a", { class: "btn", href: "tel:" + r.phone }, icon("phone"), " Call")),
    !done && !out && el("div", { class: "row" }, B("Start delivery", () => act(o, "start"), "p")),
    out && !failed && shareLine(),
    (out || done) && files, (out || done) && upLine(o),
    out && askProblem !== o.id && el("div", { class: "row" }, B("Delivered", () => act(o, "delivered"), "p"), B("Problem", () => { askProblem = o.id; render(); }, "d")),
    out && askProblem === o.id && el("div", { class: "row" },
      ["Nobody home", "Wrong address", "Refused", "Other"].map(x => B(x, () => act(o, "problem", { reason: x }), "d")), B("Back", () => { askProblem = null; render(); })));
}
function open(o) {
  return el("div", { class: "tk" },
    el("div", { class: "top" }, el("b", {}, o.arrangement || "Order"), el("span", { class: "pill" }, stage(o))),
    el("p", { class: "sub" }, [o.order, o.for && "For " + o.for, [o.city, o.zip].filter(Boolean).join(" "), o.due_window].filter(Boolean).join(" · ")),
    el("div", { class: "row" }, el("button", { class: "btn", type: "button", disabled: busy, onclick: () => act(o, "claim") }, "Take this delivery")));
}

function note(title, text, again) {
  app.replaceChildren(el("div", { class: "center" }, el("h1", {}, title), el("p", {}, text)));
  clearTimeout(note.t); if (again) note.t = setTimeout(start, 8000);
}
function render() {
  if (!data) return;
  app.replaceChildren(
    el("h1", {}, "Hi " + data.me.name.split(" ")[0]),
    el("h2", {}, "Your deliveries"),
    ...(data.mine.length ? data.mine.map(mine) : [el("div", { class: "empty" }, "Nothing assigned to you right now.")]),
    el("h2", {}, "Waiting for a driver today"),
    ...(data.open.length ? data.open.map(open) : [el("div", { class: "empty" }, "No deliveries waiting.")]));
  syncGeo();
}
async function load() {
  try { data = await rpc("driver_view"); }
  catch (e) {
    if (e.code === "LP403") { data = null; start(); }
    else if (e.code === "42501") { data = null; note("This link cannot open the driver page", "Ask the shop for a driver link."); }
  }
}
const refresh = async () => { if (data && !busy && askProblem == null) { await load(); render(); } };
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refresh(); else syncGeo(); });   // back from the maps app
async function start() {
  if (!readLink(true)) return note("Deliveries", "Open this page from your personal driver link.");
  const s = await hello();
  if (s === "pending") return note("Waiting for the shop", `This phone (“${deviceLabel()}”) needs the owner's OK once. Ask the shop to approve it; this page opens by itself after that.`, true);
  if (s === "blocked") return note("This phone has been blocked", "Ask the shop if you think this is a mistake.");
  if (s === "gone") return note("This link is no longer active", "Ask the shop for a new one.");
  if (s === "offline") return note("No connection", "Trying again in a few seconds…", true);
  await load(); render();
}
setInterval(refresh, 30000);
start();
