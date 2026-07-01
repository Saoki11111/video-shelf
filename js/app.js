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

let videos = [];
let featuredVideos = [];
let activeSlide = 0;
let carouselTimer;

function renderCarousel() {
  const video = featuredVideos[activeSlide];
  if (!video) return;

  heroCarousel.classList.remove("slide-0", "slide-1", "slide-2");
  heroCarousel.classList.add(`slide-${activeSlide}`);
  heroCarousel.setAttribute("aria-label", `ピックアップ動画 ${activeSlide + 1}/${featuredVideos.length}`);
  heroEyebrow.textContent = `PICKUP · ${video.tags[0].toUpperCase()}`;
  heroTitle.textContent = video.title;
  heroDescription.textContent = video.description;
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
    if (!event.target.closest("button")) openActiveVideo();
  });
  heroCarousel.addEventListener("keydown", (event) => {
    if (event.target !== heroCarousel || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openActiveVideo();
  });

  renderCarousel();
  startCarousel();
}

function renderTopSections() {
  const newest = [...videos]
    .sort((a, b) => (b.addedAt ?? b.publishedAt).localeCompare(a.addedAt ?? a.publishedAt))
    .slice(0, 3);

  newVideosGrid.replaceChildren(...newest.map(createCard));
}

fetchVideos()
  .then((data) => {
    videos = data;
    initializeCarousel();
    renderTopSections();
  })
  .catch(() => {
    heroDescription.textContent = "動画データを読み込めませんでした。";
  });
