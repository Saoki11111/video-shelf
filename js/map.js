
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
const LAT1 = 54, LAT0 = -14;
const canvas = document.querySelector("#travel-map-canvas");
const pinLayer = document.querySelector("#pin-layer");
const card = document.querySelector("#map-card");
const cardThumb = document.querySelector("#map-card-thumb");
const cardTitle = document.querySelector("#map-card-title");
const cardLink = document.querySelector("#map-card-link");
const ctx = canvas.getContext("2d");
let W = 0, H = 0;
let currentPlace = null;

const project = (lat, lon) => ({ x: ((lon - LON0) / (LON1 - LON0)) * W, y: ((LAT1 - lat) / (LAT1 - LAT0)) * H });

function resize() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  W = rect.width; H = rect.height;
  if (W < 620) { LON0 = 86; LON1 = 158; } else { LON0 = 60; LON1 = 162; }
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
  for (const ring of MAP_RINGS) {
    ctx.beginPath();
    for (let i = 0; i < ring.length; i += 2) {
      const p = project(ring[i + 1] / 10, ring[i] / 10);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(159,196,255,.07)"; ctx.fill();
    ctx.strokeStyle = "rgba(170,205,255,.95)"; ctx.lineWidth = 1.3; ctx.stroke();
  }
  for (const { place, el } of pinEls) {
    const p = project(place.lat, place.lon);
    el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%,-50%)`;
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

window.addEventListener("resize", resize);
resize();
openPlace(PLACES.find((p) => p.name === "札幌"));
draw();
