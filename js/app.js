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

let videos = [];
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

function renderTopSections() {
  const newest = [...videos]
    .sort((a, b) => (b.addedAt ?? b.publishedAt).localeCompare(a.addedAt ?? a.publishedAt))
    .slice(0, 3);

  newVideosGrid.replaceChildren(...newest.map(createCard));
}

const CHEVRON_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEVRON_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function getTracks(video) {
  if (!video.music) return [];
  return Array.isArray(video.music) ? video.music : [video.music];
}

function renderMusicPick() {
  const wrap = document.querySelector(".top-sections");
  if (!wrap) return;

  const entries = [];
  videos.forEach((video) => {
    getTracks(video).forEach((track) => entries.push({ video, track }));
  });
  if (!entries.length) return;

  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const selected = shuffled.slice(0, 3);

  const section = document.createElement("section");
  section.className = "shelf";
  section.setAttribute("aria-label", "Sound & Movie");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  const headingText = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "MUSIC CHOICE";
  const title = document.createElement("h2");
  title.textContent = "Sound & Movie";
  const note = document.createElement("p");
  note.className = "shelf-note";
  note.textContent = "聞いてほしい曲、動画を彩る音楽たち";
  headingText.append(eyebrow, title, note);
  const pageLink = document.createElement("a");
  pageLink.className = "section-link";
  pageLink.href = "music.html";
  pageLink.textContent = "使用曲ページ →";
  heading.append(headingText, pageLink);

  const stage = document.createElement("div");
  stage.className = "pick-stage";
  const cardLink = document.createElement("a");
  cardLink.className = "pick-card";
  stage.append(cardLink);

  const nav = document.createElement("div");
  nav.className = "pick-nav";
  const dots = document.createElement("div");
  dots.className = "pick-dots";
  const count = document.createElement("span");
  count.className = "pick-count";
  const arrows = document.createElement("div");
  arrows.className = "pick-arrows";
  const prev = document.createElement("button");
  prev.type = "button";
  prev.setAttribute("aria-label", "前の曲");
  prev.innerHTML = CHEVRON_LEFT;
  const next = document.createElement("button");
  next.type = "button";
  next.setAttribute("aria-label", "次の曲");
  next.innerHTML = CHEVRON_RIGHT;
  arrows.append(prev, next);
  nav.append(dots, count, arrows);
  stage.append(nav);

  let index = 0;
  function show(nextIndex) {
    index = ((nextIndex % selected.length) + selected.length) % selected.length;
    const { video, track } = selected[index];
    cardLink.href = `video.html?id=${encodeURIComponent(video.id)}`;
    cardLink.setAttribute("aria-label", `${track.title}が使われている動画「${video.title}」を見る`);
    cardLink.replaceChildren();

    if (track.thumbnail) {
      const backdrop = document.createElement("img");
      backdrop.className = "pick-backdrop";
      backdrop.src = track.thumbnail;
      backdrop.alt = "";
      backdrop.setAttribute("aria-hidden", "true");
      const jacket = document.createElement("img");
      jacket.className = "pick-jacket";
      jacket.src = track.thumbnail;
      jacket.alt = "";
      jacket.loading = "lazy";
      cardLink.append(backdrop, jacket);
    }

    const info = document.createElement("div");
    info.className = "pick-info";
    const song = document.createElement("p");
    song.className = "pick-song";
    song.textContent = `♪ ${track.title ?? ""}`;
    const artist = document.createElement("p");
    artist.className = "pick-artist";
    artist.textContent = track.artist ?? "";
    info.append(song, artist);
    if (track.note) {
      const noteEl = document.createElement("p");
      noteEl.className = "pick-note";
      noteEl.textContent = track.note;
      info.append(noteEl);
    }
    const used = document.createElement("p");
    used.className = "pick-video";
    used.textContent = `使用動画：${video.title}`;
    info.append(used);
    cardLink.append(info);

    cardLink.classList.remove("pick-fade");
    void cardLink.offsetWidth;
    cardLink.classList.add("pick-fade");

    dots.replaceChildren(...selected.map((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      if (i === index) dot.className = "on";
      dot.setAttribute("aria-label", `${i + 1}曲目を表示`);
      dot.addEventListener("click", () => show(i));
      return dot;
    }));
    count.textContent = `${index + 1} / ${selected.length}`;
  }
  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));

  let pickTouchX = 0;
  let pickTouchY = 0;
  let suppressPickClick = false;
  cardLink.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    pickTouchX = touch.clientX;
    pickTouchY = touch.clientY;
  }, { passive: true });
  cardLink.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - pickTouchX;
    const distanceY = touch.clientY - pickTouchY;
    if (Math.abs(distanceX) >= 50 && Math.abs(distanceX) > Math.abs(distanceY)) {
      suppressPickClick = true;
      show(index + (distanceX < 0 ? 1 : -1));
    }
  }, { passive: true });
  cardLink.addEventListener("click", (event) => {
    if (suppressPickClick) {
      suppressPickClick = false;
      event.preventDefault();
    }
  });

  show(0);

  section.append(heading, stage);
  wrap.append(section);
}

const newVideosRotator = createRowRotator(newVideosGrid);
newVideosPrev.addEventListener("click", () => newVideosRotator.rotate(-1));
newVideosNext.addEventListener("click", () => newVideosRotator.rotate(1));

fetchVideos()
  .then((data) => {
    videos = data;
    initializeCarousel();
    renderTopSections();
    renderMusicPick();
  })
  .catch(() => {
    heroDescription.textContent = "動画データを読み込めませんでした。";
  });
