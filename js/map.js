
import { MAP_RINGS } from "./map-coast.js";
const PLACES = [
  { name: "札幌", area: "日本", lat: 43.06, lon: 141.35, id: "202609-sapporo", thumb: "images/thumbnails/202609-sapporo.jpg", title: "札幌、青空と羊のいる丘" },
  { name: "石垣島", area: "日本", lat: 24.34, lon: 124.16, id: "202601-ishigaki", thumb: "images/thumbnails/202601-ishigaki.jpg", title: "石垣島、島時間" },
  { name: "上海", area: "中国", lat: 31.23, lon: 121.47, id: "202509-shanghai", thumb: "images/thumbnails/202509-shanghai.jpg", title: "上海、過去と未来のあいだ" },
  { name: "香港", area: "香港", lat: 22.32, lon: 114.17, id: "202603-hongkong", thumb: "images/thumbnails/202603-hongkong.jpg", title: "香港、光と熱気の街" },
  { name: "マニラ", area: "フィリピン", lat: 14.60, lon: 120.98, id: "202511-manila", thumb: "images/thumbnails/202511-manila.jpg", title: "マニラ、ジープニーを追いかけて" },
  { name: "バンコク", area: "タイ", lat: 13.76, lon: 100.50, id: "202502-thai", thumb: "images/thumbnails/202502-thai.webp", title: "タイ、夕暮れの市場を歩く" },
  { name: "ジャカルタ", area: "インドネシア", lat: -6.21, lon: 106.85, id: "202605-indonesia", thumb: "images/thumbnails/202605-indonesia.webp", title: "インドネシア、予定外から始まる旅" },
];
let LON0 = 86, LON1 = 158;
const LAT1 = 54, LAT0 = -14, MAX_SCALE = 3.2;
const canvas = document.querySelector("#travel-map-canvas");
const pinLayer = document.querySelector("#pin-layer");
const card = document.querySelector("#map-card");
const cardThumb = document.querySelector("#map-card-thumb");
const cardTitle = document.querySelector("#map-card-title");
const cardLink = document.querySelector("#map-card-link");
const resetButton = document.querySelector("#map-reset");
const ctx = canvas.getContext("2d");
let W = 0, H = 0, scale = 1, tx = 0, ty = 0;
let currentPlace = null;

const baseProject = (lat, lon) => ({ x: ((lon - LON0) / (LON1 - LON0)) * W, y: ((LAT1 - lat) / (LAT1 - LAT0)) * H });
const project = (lat, lon) => { const p = baseProject(lat, lon); return { x: p.x * scale + tx, y: p.y * scale + ty }; };

function clampTransform() {
  scale = Math.min(MAX_SCALE, Math.max(1, scale));
  tx = Math.min(0, Math.max(W - W * scale, tx));
  ty = Math.min(0, Math.max(H - H * scale, ty));
  if (scale === 1) { tx = 0; ty = 0; }
  canvas.style.touchAction = scale > 1.05 ? "none" : "pan-y";
  resetButton.hidden = scale <= 1.05;
}
function resetView() { scale = 1; tx = 0; ty = 0; clampTransform(); }
function zoomAt(cx, cy, factor) {
  const next = Math.min(MAX_SCALE, Math.max(1, scale * factor));
  const ratio = next / scale;
  tx = cx - (cx - tx) * ratio; ty = cy - (cy - ty) * ratio; scale = next;
  clampTransform();
}
function resize() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  W = rect.width; H = rect.height;
  if (W < 620) { LON0 = 86; LON1 = 158; } else { LON0 = 60; LON1 = 162; }
  clampTransform();
}

// ピン＝本物のボタン
const pinEls = PLACES.map((place) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "map-pin" + (place.name === "札幌" ? " label-left" : "");
  btn.setAttribute("aria-label", place.name + "の動画");
  const dot = document.createElement("span"); dot.className = "pin-dot";
  const label = document.createElement("span"); label.className = "pin-label"; label.textContent = place.name;
  btn.append(dot, label);
  btn.addEventListener("click", () => openPlace(place));
  pinLayer.append(btn);
  return { place, el: btn };
});

function draw() {
  requestAnimationFrame(draw);
  if (!W) { resize(); return; }
  ctx.fillStyle = "#0d1830"; ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 1.3;
  for (const ring of MAP_RINGS) {
    ctx.beginPath();
    for (let i = 0; i < ring.length; i += 2) {
      const p = project(ring[i + 1] / 10, ring[i] / 10);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(159,196,255,.07)"; ctx.fill();
    ctx.strokeStyle = "rgba(170,205,255,.95)"; ctx.stroke();
  }
  for (const { place, el } of pinEls) {
    const p = project(place.lat, place.lon);
    const off = p.x < -30 || p.y < -30 || p.x > W + 30 || p.y > H + 30;
    el.style.display = off ? "none" : "block";
    if (!off) el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%,-50%)`;
    el.classList.toggle("on", currentPlace === place);
  }
}


function openPlace(place) {
  currentPlace = place;
  cardThumb.src = place.thumb; cardThumb.alt = "";
  cardTitle.textContent = place.title;
  cardLink.href = `video.html?id=${encodeURIComponent(place.id)}`;
  card.hidden = false;
}

// パン・ピンチ・ホイール・ダブルタップ
const pointers = new Map();
let downX = 0, downY = 0, moved = false, pinchDist = 0, lastTapAt = 0;
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) { downX = e.clientX; downY = e.clientY; moved = false; }
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchDist = Math.hypot(a.x - b.x, a.y - b.y); moved = true; }
});
canvas.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId);
  const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 7) moved = true;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const rect = canvas.getBoundingClientRect();
    if (pinchDist > 0) zoomAt((a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top, dist / pinchDist);
    pinchDist = dist;
  } else if (pointers.size === 1 && moved && scale > 1) {
    tx += dx; ty += dy; clampTransform();
  }
});
canvas.addEventListener("pointerup", () => {
  pointers.clear(); pinchDist = 0;
  if (!moved && scale > 1) {
    const now = Date.now();
    if (now - lastTapAt < 320) { resetView(); lastTapAt = 0; } else lastTapAt = now;
  }
});
canvas.addEventListener("pointercancel", () => { pointers.clear(); pinchDist = 0; });

// 2本指ピンチをブラウザのページズームに奪われないようにする
canvas.addEventListener("touchstart", (e) => { if (e.touches.length === 2) e.preventDefault(); }, { passive: false });
canvas.addEventListener("touchmove", (e) => { if (e.touches.length === 2) e.preventDefault(); }, { passive: false });
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.12 : 0.89);
}, { passive: false });
resetButton.addEventListener("click", resetView);
document.querySelector("#map-zoom-in").addEventListener("click", () => zoomAt(W / 2, H / 2, 1.4));
document.querySelector("#map-zoom-out").addEventListener("click", () => zoomAt(W / 2, H / 2, 1 / 1.4));
document.querySelector("#map-pan-left").addEventListener("click", () => { tx += W * 0.35; clampTransform(); });
document.querySelector("#map-pan-right").addEventListener("click", () => { tx -= W * 0.35; clampTransform(); });
window.addEventListener("resize", resize);
resize(); clampTransform();
openPlace(PLACES.find((p) => p.name === "札幌"));
draw();

