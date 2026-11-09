import { MAP_DOTS } from "./map-data.js";

const PLACES = [
  { name: "札幌", area: "日本", lat: 43.06, lon: 141.35, id: "202609-sapporo", title: "札幌、青空と羊のいる丘" },
  { name: "石垣島", area: "日本", lat: 24.34, lon: 124.16, id: "202601-ishigaki", title: "石垣島、島時間" },
  { name: "上海", area: "中国", lat: 31.23, lon: 121.47, id: "202509-shanghai", title: "上海、過去と未来のあいだ" },
  { name: "香港", area: "香港", lat: 22.32, lon: 114.17, id: "202603-hongkong", title: "香港、光と熱気の街" },
  { name: "マニラ", area: "フィリピン", lat: 14.60, lon: 120.98, id: "202511-manila", title: "マニラ、ジープニーを追いかけて" },
  { name: "バンコク", area: "タイ", lat: 13.76, lon: 100.50, id: "202502-thai", title: "タイ、夕暮れの市場を歩く" },
  { name: "ジャカルタ", area: "インドネシア", lat: -6.21, lon: 106.85, id: "202605-indonesia", title: "インドネシア、予定外から始まる旅" },
];

const LON0 = 62, LON1 = 156, LAT1 = 54, LAT0 = -14;
const canvas = document.querySelector("#travel-map-canvas");
const card = document.querySelector("#map-card");
const cardPlace = document.querySelector("#map-card-place");
const cardTitle = document.querySelector("#map-card-title");
const cardLink = document.querySelector("#map-card-link");

if (canvas) {
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, pins = [], landCache = null;

  const project = (lat, lon) => ({
    x: ((lon - LON0) / (LON1 - LON0)) * W,
    y: ((LAT1 - lat) / (LAT1 - LAT0)) * H,
  });

  function renderLand() {
    landCache = document.createElement("canvas");
    landCache.width = W;
    landCache.height = H;
    const c = landCache.getContext("2d");
    c.fillStyle = "#0d1830";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(159,196,255,.85)";
    const r = Math.max(1.2, W / 340);
    for (let i = 0; i < MAP_DOTS.length; i += 2) {
      const p = project(MAP_DOTS[i + 1] / 10, MAP_DOTS[i] / 10);
      c.beginPath();
      c.arc(p.x, p.y, r, 0, 7);
      c.fill();
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    W = canvas.width;
    H = canvas.height;
    renderLand();
  }

  function draw() {
    requestAnimationFrame(draw);
    if (!W) { resize(); return; }
    if (!landCache) return;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(landCache, 0, 0);
    pins = [];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pulse = 1 + 0.25 * Math.sin(Date.now() / 350);
    ctx.font = `600 ${10.5 * dpr}px sans-serif`;
    for (const place of PLACES) {
      const p = project(place.lat, place.lon);
      pins.push({ x: p.x, y: p.y, place });
      ctx.fillStyle = "rgba(255,176,66,.35)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5.5 * dpr * pulse, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#ffb042";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.6 * dpr + 1.4, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#0b1220";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(232,240,255,.95)";
      if (place.name === "札幌") {
        ctx.textAlign = "right";
        ctx.fillText(place.name, p.x - 5 * dpr, p.y + 3.5);
      } else {
        ctx.textAlign = "left";
        ctx.fillText(place.name, p.x + 5 * dpr, p.y + 3.5);
      }
    }
  }

  canvas.addEventListener("pointerup", (event) => {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const mx = (event.clientX - rect.left) * scale;
    const my = (event.clientY - rect.top) * scale;
    let best = null, bestDist = 24 * (window.devicePixelRatio || 1);
    for (const pin of pins) {
      const d = Math.hypot(pin.x - mx, pin.y - my);
      if (d < bestDist) { bestDist = d; best = pin; }
    }
    if (best && card) {
      cardPlace.textContent = `${best.place.area} ・ ${best.place.name}`;
      cardTitle.textContent = best.place.title;
      cardLink.href = `video.html?id=${encodeURIComponent(best.place.id)}`;
      card.hidden = false;
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  window.addEventListener("resize", resize);
  resize();
  draw();
}
