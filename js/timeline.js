import { createCard, fetchVideos } from "./shared.js";

const summary = document.querySelector("#timeline-summary");
const timeline = document.querySelector("#timeline");
const emptyState = document.querySelector("#timeline-empty");
const tagFilters = document.querySelector("#tag-filters");
const tagCarouselPrev = document.querySelector("#tag-carousel-prev");
const tagCarouselNext = document.querySelector("#tag-carousel-next");

let videos = [];
const selectedTags = new Set();

const heroCarousel = document.querySelector("#hero-carousel");
const heroThumbnail = document.querySelector("#hero-thumbnail");
const heroEyebrow = document.querySelector("#hero-eyebrow");
const heroTitle = document.querySelector("#hero-title");
const heroDescription = document.querySelector("#hero-description");
const heroNumber = document.querySelector("#hero-number");
const carouselPrev = document.querySelector("#carousel-prev");
const carouselNext = document.querySelector("#carousel-next");
const carouselDots = document.querySelector("#carousel-dots");

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
  const MAX_LINE_LENGTH = 16;
  const lines = [];
  description
    .split("。")
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .forEach((sentence) => {
      const fragments = sentence.split("、");
      let current = "";
      fragments.forEach((fragment, index) => {
        const piece = index < fragments.length - 1 ? `${fragment}、` : `${fragment}。`;
        if (current && (current + piece).length > MAX_LINE_LENGTH) {
          lines.push(current);
          current = piece;
        } else {
          current += piece;
        }
      });
      if (current) lines.push(current);
    });
  element.replaceChildren(
    ...lines.map((text) => {
      const line = document.createElement("span");
      line.textContent = text;
      return line;
    }),
  );
}

let featuredVideos = [];
let activeSlide = 0;
let carouselTimer;
let touchStartX = 0;
let touchStartY = 0;
let suppressHeroClick = false;

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

function createRowRotator(grid) {
  let animating = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let suppressClick = false;

  function rotate(direction) {
    if (animating) return;
    const cards = [...grid.querySelectorAll(".video-card")];
    if (cards.length < 2) return;
    const distance = cards[0].getBoundingClientRect().width + 12;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    animating = true;

    if (direction > 0) {
      grid.scrollTo({ left: distance, behavior: reducedMotion ? "auto" : "smooth" });
      setTimeout(() => {
        grid.append(cards[0]);
        grid.scrollLeft = 0;
        animating = false;
      }, reducedMotion ? 0 : 220);
      return;
    }

    grid.prepend(cards.at(-1));
    grid.scrollLeft = distance;
    requestAnimationFrame(() => {
      grid.scrollTo({ left: 0, behavior: reducedMotion ? "auto" : "smooth" });
      setTimeout(() => {
        animating = false;
      }, reducedMotion ? 0 : 220);
    });
  }

  grid.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });
  grid.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - touchStartX;
    const distanceY = touch.clientY - touchStartY;
    if (Math.abs(distanceX) >= 40 && Math.abs(distanceX) > Math.abs(distanceY)) {
      suppressClick = true;
      rotate(distanceX < 0 ? 1 : -1);
      setTimeout(() => {
        suppressClick = false;
      }, 300);
    }
  }, { passive: true });
  grid.addEventListener("click", (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    suppressClick = false;
  });

  return { rotate };
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



function getTracks(video) {
  if (!video.music) return [];
  return Array.isArray(video.music) ? video.music : [video.music];
}

function createTimelineCard(video) {
  const card = createCard(video);
  const tracks = getTracks(video);
  if (tracks.length) {
    const body = card.querySelector(".card-body");
    const date = card.querySelector(".card-date");
    if (body) {
      const music = document.createElement("p");
      music.className = "card-music";
      music.textContent = `♪ ${tracks.map((track) => `${track.title}／${track.artist}`).join("、")}`;
      body.insertBefore(music, date);
    }
  }
  return card;
}

function renderTags() {
  tagFilters.replaceChildren();
  const tags = ["すべて", ...new Set(videos.flatMap((video) => video.tags))];

  tags.forEach((tag) => {
    const isActive = selectedTags.size === 0 || selectedTags.has(tag);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tag-button${isActive ? " active" : ""}`;
    button.textContent = tag;
    button.setAttribute("aria-pressed", String(isActive));
    button.addEventListener("click", () => {
      if (tag === "すべて") {
        selectedTags.clear();
      } else if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
      } else {
        selectedTags.add(tag);
      }
      renderTags();
      renderTimeline();
    });
    tagFilters.append(button);
  });
}

function renderTimeline() {
  timeline.replaceChildren();

  const filtered = videos
    .filter((video) => selectedTags.size === 0
      || video.tags.some((tag) => selectedTags.has(tag)))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const grouped = new Map();
  filtered.forEach((video) => {
    const year = new Date(`${video.publishedAt}T00:00:00`).getFullYear();
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year).push(video);
  });

  const years = [...grouped.keys()].sort((a, b) => b - a);
  const conditions = [];
  if (selectedTags.size > 0) conditions.push([...selectedTags].join("・"));
  summary.textContent = conditions.length === 0
    ? `${filtered.length}本 / ${years.length}年`
    : `${conditions.join("・")}で ${filtered.length}本 / ${years.length}年`;

  if (filtered.length === 0) {
    emptyState.textContent = "該当する動画はありません。";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  const fragment = document.createDocumentFragment();
  years.forEach((year) => {
    const section = document.createElement("section");
    section.className = "timeline-year";

    const heading = document.createElement("div");
    heading.className = "timeline-heading";
    const title = document.createElement("h2");
    title.textContent = `${year}年`;
    const note = document.createElement("p");
    note.textContent = `${grouped.get(year).length}本`;
    heading.append(title, note);

    const grid = document.createElement("div");
    grid.className = "video-grid timeline-grid";
    grid.append(...grouped.get(year).map(createTimelineCard));

    section.append(heading, grid);
    fragment.append(section);
  });

  timeline.append(fragment);
}

function scrollTags(direction) {
  const firstTag = tagFilters.querySelector(".tag-button");
  if (!firstTag) return;
  tagFilters.scrollBy({
    left: direction * (firstTag.getBoundingClientRect().width + 8),
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
  });
}

tagCarouselPrev.addEventListener("click", () => scrollTags(-1));
tagCarouselNext.addEventListener("click", () => scrollTags(1));

fetchVideos()
  .then((data) => {
    videos = data;
    initializeCarousel();
    renderTags();
    renderTimeline();
  })
  .catch(() => {
    emptyState.textContent = "動画データを読み込めませんでした。";
    emptyState.hidden = false;
  });
