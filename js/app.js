import { createCard, fetchVideos } from "./shared.js";

const newVideosGrid = document.querySelector("#new-videos");
const heroCarousel = document.querySelector("#hero-carousel");
const heroThumbnail = document.querySelector("#hero-thumbnail");
const heroEyebrow = document.querySelector("#hero-eyebrow");
const heroTitle = document.querySelector("#hero-title");
const heroDescription = document.querySelector("#hero-description");
const heroNumber = document.querySelector("#hero-number");
const carouselPrev = document.querySelector("#carousel-prev");
const carouselNext = document.querySelector("#carousel-next");
const carouselDots = document.querySelector("#carousel-dots");
const newVideosPrev = document.querySelector("#new-videos-prev");
const newVideosNext = document.querySelector("#new-videos-next");

const CATEGORIES = [
  { eyebrow: "CATEGORY 01 — SOUND", title: "街の音が残る旅", note: "喧騒、エンジン、街角のざわめきが主役のもの", ids: ["202603-hongkong", "202511-manila", "202509-shanghai", "202605-indonesia"] },
  { eyebrow: "CATEGORY 02 — TIME", title: "ゆっくり流れる時間", note: "急がない旅。海と牧場と、島の速度", ids: ["202601-ishigaki", "202609-sapporo", "202502-thai", "202605-indonesia"] },
  { eyebrow: "CATEGORY 03 — LIGHT", title: "夕暮れと夜の光", note: "一日の終わりの色が残るもの", ids: ["202502-thai", "202603-hongkong", "202609-sapporo", "202509-shanghai"] },
  { eyebrow: "CATEGORY 04 — RIDE", title: "乗り物から見る景色", note: "移動そのものが思い出になっている旅", ids: ["202511-manila", "202603-hongkong", "202605-indonesia"] },
  { eyebrow: "CATEGORY 05 — FOOD", title: "市場と食の記憶", note: "その土地の味と匂いが残るもの", ids: ["202502-thai", "202511-manila", "202605-indonesia", "202609-sapporo"] },
  { eyebrow: "CATEGORY 06 — BLUE", title: "青い景色", note: "空と海と港。青が主役の旅", ids: ["202609-sapporo", "202601-ishigaki", "202603-hongkong"] },
  { eyebrow: "CATEGORY 07 — LANDMARK", title: "街のシンボルを訪ねて", note: "その街の「顔」が映っているもの", ids: ["202609-sapporo", "202502-thai", "202509-shanghai"] },
  { eyebrow: "CATEGORY 08 — SOUTHEAST ASIA", title: "東南アジアの旅", note: "この棚の中心地帯。熱気と市場の3本", ids: ["202605-indonesia", "202502-thai", "202511-manila"] },
  { eyebrow: "CATEGORY 09 — ARCHIVE 2026", title: "2026年の旅", note: "年ごとに増えていくアーカイブ棚", ids: ["202609-sapporo", "202605-indonesia", "202603-hongkong", "202601-ishigaki"] },
];

function setTitleLines(element, title) {
  const parts = title.split("、");
  const nodes = [];
  parts.forEach((part, index) => {
    if (index > 0) nodes.push(document.createElement("br"));
    nodes.push(document.createTextNode(index < parts.length - 1 ? `${part}、` : part));
  });
  element.replaceChildren(...nodes);
}

function setSentenceLines(element, description) {
  const sentences = description.split("。").map((s) => s.trim()).filter(Boolean);
  element.replaceChildren(...sentences.map((sentence) => {
    const line = document.createElement("span");
    line.textContent = `${sentence}。`;
    return line;
  }));
}

let videos = [];
let featuredVideos = [];
let activeSlide = 0;
let carouselTimer;
let touchStartX = 0;
let touchStartY = 0;
let suppressHeroClick = false;
let newVideosTouchStartX = 0;
let newVideosTouchStartY = 0;
let suppressNewVideoClick = false;
let newVideosAnimating = false;

function renderCarousel() {
  const video = featuredVideos[activeSlide];
  if (!video) return;

  heroCarousel.classList.remove("slide-0", "slide-1", "slide-2");
  heroCarousel.classList.add(`slide-${activeSlide}`);
  heroCarousel.setAttribute("aria-label", `ピックアップ動画 ${activeSlide + 1}/${featuredVideos.length}`);
  heroEyebrow.textContent = `PICKUP · ${video.tags[0].toUpperCase()}`;
  setTitleLines(heroTitle, video.title);
  setSentenceLines(heroDescription, video.description);
  heroNumber.textContent = String(activeSlide + 1).padStart(2, "0");
  heroThumbnail.src = video.thumbnail;

  [...carouselDots.children].forEach((dot, index) => {
    dot.classList.toggle("active", index === activeSlide);
    dot.setAttribute("aria-current", index === activeSlide ? "true" : "false");
  });
}

function selectSlide(index) {
  activeSlide = (index + featuredVideos.length) % featuredVideos.length;
  renderCarousel();
}

function openActiveVideo() {
  const video = featuredVideos[activeSlide];
  if (video) location.href = `video.html?id=${encodeURIComponent(video.id)}`;
}

function stopCarousel() {
  clearInterval(carouselTimer);
}

function startCarousel() {
  stopCarousel();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  carouselTimer = setInterval(() => selectSlide(activeSlide + 1), 5000);
}

function rotateNewVideos(direction) {
  if (newVideosAnimating) return;
  const cards = [...newVideosGrid.querySelectorAll(".video-card")];
  if (cards.length < 2) return;
  const distance = cards[0].getBoundingClientRect().width + 12;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  newVideosAnimating = true;

  if (direction > 0) {
    newVideosGrid.scrollTo({ left: distance, behavior: reducedMotion ? "auto" : "smooth" });
    setTimeout(() => {
      newVideosGrid.append(cards[0]);
      newVideosGrid.scrollLeft = 0;
      newVideosAnimating = false;
    }, reducedMotion ? 0 : 220);
    return;
  }

  newVideosGrid.prepend(cards.at(-1));
  newVideosGrid.scrollLeft = distance;
  requestAnimationFrame(() => {
    newVideosGrid.scrollTo({ left: 0, behavior: reducedMotion ? "auto" : "smooth" });
    setTimeout(() => {
      newVideosAnimating = false;
    }, reducedMotion ? 0 : 220);
  });
}

function initializeCarousel() {
  const shuffledVideos = [...videos];
  for (let index = shuffledVideos.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledVideos[index], shuffledVideos[randomIndex]] = [shuffledVideos[randomIndex], shuffledVideos[index]];
  }
  featuredVideos = shuffledVideos.slice(0, 3);

  carouselDots.replaceChildren(...featuredVideos.map((video, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `${video.title}を表示`);
    dot.addEventListener("click", () => {
      selectSlide(index);
      startCarousel();
    });
    return dot;
  }));

  carouselPrev.addEventListener("click", () => {
    selectSlide(activeSlide - 1);
    startCarousel();
  });
  carouselNext.addEventListener("click", () => {
    selectSlide(activeSlide + 1);
    startCarousel();
  });
  heroCarousel.addEventListener("mouseenter", stopCarousel);
  heroCarousel.addEventListener("mouseleave", startCarousel);
  heroCarousel.addEventListener("focusin", stopCarousel);
  heroCarousel.addEventListener("focusout", startCarousel);
  heroCarousel.addEventListener("click", (event) => {
    if (suppressHeroClick) {
      suppressHeroClick = false;
      return;
    }
    if (!event.target.closest("button")) openActiveVideo();
  });
  heroCarousel.addEventListener("keydown", (event) => {
    if (event.target !== heroCarousel || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openActiveVideo();
  });
  heroCarousel.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    stopCarousel();
  }, { passive: true });
  heroCarousel.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - touchStartX;
    const distanceY = touch.clientY - touchStartY;
    if (Math.abs(distanceX) >= 50 && Math.abs(distanceX) > Math.abs(distanceY)) {
      suppressHeroClick = true;
      selectSlide(activeSlide + (distanceX < 0 ? 1 : -1));
    }
    startCarousel();
  }, { passive: true });
  heroCarousel.addEventListener("touchcancel", startCarousel, { passive: true });

  renderCarousel();
  startCarousel();
}

function renderTopSections() {
  const newest = [...videos]
    .sort((a, b) => (b.addedAt ?? b.publishedAt).localeCompare(a.addedAt ?? a.publishedAt))
    .slice(0, 3);

  newVideosGrid.replaceChildren(...newest.map(createCard));
}

function renderCategories() {
  const wrap = document.querySelector(".top-sections");
  if (!wrap) return;
  const byId = new Map(videos.map((video) => [video.id, video]));

  CATEGORIES.forEach((category) => {
    const items = category.ids.map((id) => byId.get(id)).filter(Boolean);
    if (!items.length) return;

    const section = document.createElement("section");
    section.className = "shelf";
    section.setAttribute("aria-label", category.title);

    const heading = document.createElement("div");
    heading.className = "section-heading";
    const headingText = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = category.eyebrow;
    const title = document.createElement("h2");
    title.textContent = category.title;
    const note = document.createElement("p");
    note.className = "shelf-note";
    note.textContent = category.note;
    headingText.append(eyebrow, title, note);
    heading.append(headingText);

    const grid = document.createElement("div");
    grid.className = "video-grid category-grid";
    grid.append(...items.map(createCard));

    section.append(heading, grid);
    wrap.append(section);
  });
}

newVideosPrev.addEventListener("click", () => rotateNewVideos(-1));
newVideosNext.addEventListener("click", () => rotateNewVideos(1));
newVideosGrid.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  newVideosTouchStartX = touch.clientX;
  newVideosTouchStartY = touch.clientY;
}, { passive: true });
newVideosGrid.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const distanceX = touch.clientX - newVideosTouchStartX;
  const distanceY = touch.clientY - newVideosTouchStartY;
  if (Math.abs(distanceX) >= 40 && Math.abs(distanceX) > Math.abs(distanceY)) {
    suppressNewVideoClick = true;
    rotateNewVideos(distanceX < 0 ? 1 : -1);
    setTimeout(() => {
      suppressNewVideoClick = false;
    }, 300);
  }
}, { passive: true });
newVideosGrid.addEventListener("click", (event) => {
  if (!suppressNewVideoClick) return;
  event.preventDefault();
  suppressNewVideoClick = false;
});

fetchVideos()
  .then((data) => {
    videos = data;
    initializeCarousel();
    renderTopSections();
    renderCategories();
  })
  .catch(() => {
    heroDescription.textContent = "動画データを読み込めませんでした。";
  });
