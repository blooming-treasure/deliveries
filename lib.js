"use strict";
// Shared by the dashboard (dash.html) and the driver page (driver.html). No third-party code here.
// Nothing is ever put on the page as HTML: every element is built with el(), so order text can never run as code.
if (top !== self) { document.documentElement.textContent = ""; throw new Error("This page cannot be shown inside another page."); }   // no clickjacking
const LOOP_URL = "https://vfphzezqnegvitnvqpes.supabase.co";
const LOOP_KEY = "sb_publishable_ibhRhkM12PhBXl18dYrObQ_ZcFZ-NtB";   // public by design: it opens nothing by itself
const PUBLIC = { dash: "https://blooming-treasure.github.io/orders/", driver: "https://blooming-treasure.github.io/deliveries/" };

// Screens are built with `cond && node`: when cond is false the browser's own replaceChildren / append would print the
// word "false" or "null" on the page (it did, on Deliveries). Make both skip empty values and accept lists.
for (const m of ["replaceChildren", "append"]) { const f = Element.prototype[m];
  Element.prototype[m] = function (...kids) { return f.apply(this, kids.flat(3).filter(k => k != null && k !== false)); }; }
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat(3)) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(String(k)));
  return n;
};
const ICONS = {
  today: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  prep: "M9 4h6v3H9zM9 5H6v15h12V5h-3M8.5 13l2 2 4-4.5",
  card: "M4 20l4-1L19 8l-3-3L5 16l-1 4zM14 7l3 3",
  ribbon: "M7 3h10v18l-5-4-5 4zM10 8h4M10 11.5h4",
  more: "M4 6h16M4 12h16M4 18h16",
  chat: "M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  orders: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  deliveries: "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  customers: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 19v-1a4 4 0 0 0-3-3.9M15.5 3.2a3.5 3.5 0 0 1 0 6.6",
  messages: "M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM3.5 7.5l8.5 6 8.5-6",
  reports: "M5 20V10M12 20V4M19 20v-7",
  team: "M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3zM9.5 12l2 2 3.5-4",
  activity: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  close: "M6 6l12 12M18 6L6 18",
  camera: "M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  pin: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z",
  copy: "M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  play: "M8 5l11 7-11 7z",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
  back: "M15 5l-7 7 7 7",
  check: "M5 12.5l4.5 4.5L19 7.5",
};
function icon(name, size = 18) {
  const NS = "http://www.w3.org/2000/svg", s = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
  for (const [k, v] of Object.entries({ viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true", class: "ic" })) s.setAttribute(k, v);
  for (const [k, v] of Object.entries({ d: ICONS[name], fill: "none", stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round" })) p.setAttribute(k, v);
  s.append(p);
  return s;
}

// ---------------------------------------------------------------- who is using this page
// A person = a personal link (the key). A device = a random secret this browser makes for itself. The database
// only answers when the key is valid AND the device has been approved for that person.
const store = { get: k => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }, set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} } };
const b64u = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const randomSecret = (n = 24) => b64u(crypto.getRandomValues(new Uint8Array(n)));
async function sha256hex(text) { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))].map(b => b.toString(16).padStart(2, "0")).join(""); }
const nonce = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const auth = { key: "", device: "" };
// keepInAddress: the driver page keeps "#k=…&d=…" in the address so a bookmark or home-screen icon still opens
// this driver's page on this phone (phones wipe saved page data). The dashboard takes it out of the address bar.
function readLink(keepInAddress) {
  const h = location.hash.slice(1), q = h.includes("=") ? new URLSearchParams(h) : null;
  const linkKey = q ? q.get("k") || "" : /^[\w-]{20,}$/.test(h) ? h : "";
  auth.key = linkKey || store.get("loop_key") || store.get("loop_staff_key") || store.get("loop_driver_key");
  auth.device = (q && q.get("d")) || store.get("loop_device") || randomSecret(32);
  store.set("loop_key", auth.key); store.set("loop_device", auth.device);
  if (!auth.key) return false;
  if (keepInAddress) history.replaceState(null, "", location.pathname + "#k=" + auth.key + "&d=" + auth.device);
  else if (linkKey) history.replaceState(null, "", location.pathname + "#/");
  return true;
}
function signOut() { store.set("loop_key", ""); store.set("loop_staff_key", ""); store.set("loop_driver_key", ""); auth.key = ""; location.hash = ""; location.reload(); }
function deviceLabel() {
  const u = navigator.userAgent, os = /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) ? "iPad" : /Android/.test(u) ? "Android phone" : /Windows/.test(u) ? "Windows PC" : /Mac OS/.test(u) ? "Mac" : "device";
  const br = /Edg\//.test(u) ? "Edge" : /CriOS|Chrome\//.test(u) ? "Chrome" : /Firefox|FxiOS/.test(u) ? "Firefox" : /Safari/.test(u) ? "Safari" : "browser";
  return `${br} on ${os}`;
}
async function rpc(fn, body = {}, signed = true) {
  let r;
  try {
    r = await fetch(`${LOOP_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: LOOP_KEY, Authorization: "Bearer " + LOOP_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(signed ? { p_key: auth.key, p_device: auth.device, ...body } : body) });
  } catch (e) { throw Object.assign(new Error("No connection"), { code: "offline" }); }
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw Object.assign(new Error(e.message || "HTTP " + r.status), { code: e.code }); }
  return r.json();
}
// -> "approved" | "pending" | "blocked" | "gone" (link switched off) | "offline"
async function hello() {
  try { const h = await rpc("dash_hello", { p_label: deviceLabel() }); auth.name = h.name; auth.role = h.role; return h.state; }
  catch (e) { return e.code === "42501" ? "gone" : "offline"; }
}

// ---------------------------------------------------------------- small helpers
function toast(msg, bad, action) {      // action = [label, fn]: a button inside the notice (e.g. Undo)
  let t = document.getElementById("toast");
  if (!t) document.body.append(t = el("div", { id: "toast", role: "status" }));
  t.replaceChildren(msg, action ? el("button", { type: "button", onclick: () => { t.hidden = true; action[1](); } }, action[0]) : "");
  t.className = bad ? "bad" : ""; t.setAttribute("role", bad ? "alert" : "status"); t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, bad ? 6000 : action ? 9000 : 3200);
}
const money = v => v == null || v === "" ? "" : "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", "").toLowerCase() : "";
const fmtDate = iso => iso ? new Date(String(iso).length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";
const fmtStamp = iso => iso ? fmtDate(iso) + ", " + fmtTime(iso) : "";
const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
function ago(iso) {
  if (!iso) return "never";
  const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  return s < 90 ? "just now" : s < 3600 ? Math.round(s / 60) + " min ago" : s < 86400 ? Math.round(s / 3600) + " h ago" : Math.round(s / 86400) + " d ago";
}
const safeUrl = u => /^https:\/\//i.test(u || "") ? u : null;      // links that came from other systems: https only
const phoneNice = p => { const d = String(p || "").replace(/\D/g, "").slice(-10); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p || ""; };
async function copyText(text, what) { try { await navigator.clipboard.writeText(text); toast((what || "Copied") + " copied"); } catch (e) { toast("Could not copy", true); } }

// ---------------------------------------------------------------- photos and videos
// Files go to private storage. Every request carries this person's key + device; the database decides.
const fileHeaders = extra => ({ apikey: LOOP_KEY, Authorization: "Bearer " + LOOP_KEY, "x-loop-key": auth.key, "x-loop-device": auth.device, ...extra });
const CHUNK = 40 * 1024 * 1024, MAX_VIDEO = 12 * CHUNK;

function shrink(file, edge = 1600, quality = 0.8) {      // any phone photo -> a JPEG no larger than `edge` px
  return new Promise((ok, bad) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, edge / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? ok(b) : bad(new Error("Could not read that photo")), "image/jpeg", quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); bad(new Error("That file is not a photo this device can read")); };
    img.src = url;
  });
}
function put(path, blob, type, onProgress, tries = 4) {   // one object, with progress and retries (phones lose signal)
  return new Promise((ok, bad) => {
    const x = new XMLHttpRequest();
    x.open("POST", `${LOOP_URL}/storage/v1/object/loop/${path}`);
    for (const [k, v] of Object.entries(fileHeaders({ "Content-Type": type }))) x.setRequestHeader(k, v);
    x.upload.onprogress = e => onProgress && onProgress(e.loaded);
    const again = why => tries > 1 ? setTimeout(() => put(path, blob, type, onProgress, tries - 1).then(ok, bad), 2500) : bad(new Error(why));
    x.onload = () => x.status === 200 || /Duplicate|already exists/i.test(x.responseText) ? ok() : x.status >= 500 ? again("Upload failed") : bad(new Error("Upload refused"));
    x.onerror = x.ontimeout = () => again("Upload failed: no connection");
    x.send(blob);
  });
}
// Upload one photo or video for an order. Photos are shrunk here; videos go up as they are, in pieces, and the
// shop PC compresses them. onProgress(0..1). Returns the order's file list.
async function uploadMedia(orderId, file, kind, note, onProgress = () => {}) {
  const video = (file.type || "").startsWith("video/");
  if (video && file.size > MAX_VIDEO) throw new Error("That video is too long. Keep it under about 5 minutes.");
  const body = video ? file : await shrink(file), parts = video ? Math.max(1, Math.ceil(body.size / CHUNK)) : 1;
  const t = await rpc("media_add", { p_order: orderId, p_arg: { kind, type: video ? "video" : "photo", bytes: body.size, parts, mime: file.type, note } });
  for (let i = 0; i < parts; i++)
    await put(video ? `${t.path}.raw${i}` : t.path, video ? body.slice(i * CHUNK, (i + 1) * CHUNK) : body, video ? "application/octet-stream" : "image/jpeg",
      sent => onProgress((i * CHUNK + sent) / body.size));
  return rpc("media_done", { p_id: t.id });
}
const blobUrls = new Map();
async function mediaUrl(path) {                           // a file -> a private in-page address (kept for the visit)
  if (!blobUrls.has(path)) {
    const r = await fetch(`${LOOP_URL}/storage/v1/object/loop/${path}`, { headers: fileHeaders() });
    if (!r.ok) throw new Error("File not available");
    blobUrls.set(path, URL.createObjectURL(await r.blob()));
  }
  return blobUrls.get(path);
}
// A thumbnail tile for one file. Click opens it full size (photo) or plays it (video).
function mediaTile(m) {
  const video = m.type === "video", ready = m.state === "ready";
  const t = el("button", { class: "tile" + (video ? " vid" : ""), type: "button", title: [m.kind === "bloom" ? "Arrangement" : m.kind === "proof" ? "Delivery proof" : "Other", m.by, fmtStamp(m.at), m.note].filter(Boolean).join(" · "),
    onclick: () => ready ? viewMedia(m) : toast(m.state === "archived" ? "This video is over 60 days old: it is kept on the shop PC, in OneDrive > Blooming Treasure Orders." : "The shop PC is still compressing this video. It needs to be switched on.") });
  if (ready || (video && m.state !== "uploaded")) mediaUrl(video ? m.path + ".jpg" : m.path).then(u => t.prepend(el("img", { src: u, alt: "" }))).catch(() => {});
  t.append(el("span", { class: "tag " + m.kind }, m.kind === "bloom" ? "Arrangement" : m.kind === "proof" ? "Proof" : "Other"));
  if (video) t.append(el("span", { class: "badge" }, m.state === "uploaded" ? "Processing…" : m.state === "archived" ? "On shop PC" : icon("play", 16)));
  return t;
}
async function viewMedia(m) {
  const box = el("div", { class: "lightbox", role: "dialog", "aria-modal": "true", "aria-label": "Photo or video", onclick: e => e.target === box && box.remove() }, el("div", { class: "center" }, "Loading…"));
  document.body.append(box);
  try {
    const url = await mediaUrl(m.path), name = `${m.kind}-${String(m.at).slice(0, 10)}.${m.type === "video" ? "mp4" : "jpg"}`;
    box.replaceChildren(
      m.type === "video" ? el("video", { src: url, controls: true, autoplay: true, playsinline: true }) : el("img", { src: url, alt: "" }),
      el("div", { class: "bar" }, el("span", {}, [m.by, fmtStamp(m.at), m.note].filter(Boolean).join(" · ")),
        el("a", { class: "btn", href: url, download: name }, icon("download", 16), " Save"), el("button", { class: "btn", type: "button", onclick: () => box.remove() }, "Close")));
  } catch (e) { box.remove(); toast(e.message, true); }
}
