const DATA_URL = "data/videos.json";

const grid = document.querySelector("#video-grid");
const tagFilters = document.querySelector("#tag-filters");
const count = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const sortSelect = document.querySelector("#sort-select");
const heroCarousel = document.querySelector("#hero-carousel");
const heroThumbnail = document.querySelector("#hero-thumbnail");
const heroEyebrow = document.querySelector("#hero-eyebrow");
const heroTitle = document.querySelector("#hero-title");
const heroDescription = document.querySelector("#hero-description");
const heroWatch = document.querySelector("#hero-watch");
const heroNumber = document.querySelector("#hero-number");
const carouselPrev = document.querySelector("#carousel-prev");
const carouselNext = document.querySelector("#carousel-next");
const carouselDots = document.querySelector("#carousel-dots");

let videos = [];
let selectedTag = "すべて";
let featuredVideos = [];
let activeSlide = 0;
let carouselTimer;

const formatDate = (date) => new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long"
}).format(new Date(`${date}T00:00:00`));

function renderCarousel() {
  const video = featuredVideos[activeSlide];
  if (!video) return;

  heroCarousel.classList.remove("slide-0", "slide-1", "slide-2");
  heroCarousel.classList.add(`slide-${activeSlide}`);
  heroCarousel.setAttribute("aria-label", `おすすめ動画 ${activeSlide + 1}/${featuredVideos.length}`);
  heroEyebrow.textContent = `RECOMMENDED · ${video.tags[0].toUpperCase()}`;
  heroTitle.textContent = video.title;
  heroDescription.textContent = video.description;
  heroWatch.href = `video.html?id=${encodeURIComponent(video.id)}`;
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

function stopCarousel() {
  clearInterval(carouselTimer);
}

function startCarousel() {
  stopCarousel();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  carouselTimer = setInterval(() => selectSlide(activeSlide + 1), 5000);
}

function initializeCarousel() {
  featuredVideos = [...videos]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 3);

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
    if (!event.target.closest("a, button")) location.href = heroWatch.href;
  });

  renderCarousel();
  startCarousel();
}

function createCard(video) {
  const card = document.createElement("article");
  card.className = "video-card";

  const link = document.createElement("a");
  link.href = `video.html?id=${encodeURIComponent(video.id)}`;
  link.setAttribute("aria-label", `${video.title}を見る`);

  const visual = document.createElement("div");
  visual.className = "card-visual";
  const thumbnail = document.createElement("img");
  thumbnail.className = "card-thumbnail";
  thumbnail.src = video.thumbnail;
  thumbnail.alt = "";
  thumbnail.loading = "lazy";
  thumbnail.decoding = "async";
  const playMark = document.createElement("span");
  playMark.className = "play-mark";
  playMark.setAttribute("aria-hidden", "true");
  playMark.textContent = "▶";
  visual.append(thumbnail, playMark);

  const body = document.createElement("div");
  body.className = "card-body";
  const tags = document.createElement("div");
  tags.className = "card-tags";
  video.tags.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.textContent = `#${tag}`;
    tags.append(tagElement);
  });
  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = video.title;
  const date = document.createElement("p");
  date.className = "card-date";
  date.textContent = formatDate(video.publishedAt);

  body.append(tags, title, date);
  link.append(visual, body);
  card.append(link);
  return card;
}

function renderVideos() {
  const filtered = videos
    .filter((video) => selectedTag === "すべて" || video.tags.includes(selectedTag))
    .sort((a, b) => sortSelect.value === "recommended"
      ? a.sortOrder - b.sortOrder
      : b.publishedAt.localeCompare(a.publishedAt));

  grid.replaceChildren(...filtered.map(createCard));
  count.textContent = `${filtered.length}本の動画`;
  emptyState.hidden = filtered.length !== 0;
}

function renderTags() {
  tagFilters.replaceChildren();
  const tags = ["すべて", ...new Set(videos.flatMap((video) => video.tags))];
  tags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tag-button${tag === selectedTag ? " active" : ""}`;
    button.textContent = tag;
    button.addEventListener("click", () => {
      selectedTag = tag;
      renderTags();
      renderVideos();
    });
    tagFilters.append(button);
  });
}

sortSelect.addEventListener("change", renderVideos);

fetch(DATA_URL)
  .then((response) => {
    if (!response.ok) throw new Error("動画データを取得できませんでした");
    return response.json();
  })
  .then((data) => {
    videos = data;
    initializeCarousel();
    renderTags();
    renderVideos();
  })
  .catch(() => {
    emptyState.textContent = "動画データを読み込めませんでした。";
    emptyState.hidden = false;
  });
