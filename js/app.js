const DATA_URL = "data/videos.json";
const LIKES_KEY = "video-shelf-likes";
const LEGACY_FAVORITES_KEY = "video-shelf-favorites";

const grid = document.querySelector("#video-grid");
const tagFilters = document.querySelector("#tag-filters");
const count = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const sortSelect = document.querySelector("#sort-select");
const likesFilter = document.querySelector("#likes-filter");
const heroCarousel = document.querySelector("#hero-carousel");
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
let showLikesOnly = false;
let featuredVideos = [];
let activeSlide = 0;
let carouselTimer;

const readLikes = () => JSON.parse(
  localStorage.getItem(LIKES_KEY) || localStorage.getItem(LEGACY_FAVORITES_KEY) || "[]"
);
const saveLikes = (items) => localStorage.setItem(LIKES_KEY, JSON.stringify(items));
const formatDate = (date) => new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long"
}).format(new Date(`${date}T00:00:00`));

function renderCarousel() {
  const video = featuredVideos[activeSlide];
  if (!video) return;

  heroCarousel.classList.remove("slide-0", "slide-1", "slide-2");
  heroCarousel.classList.add(`slide-${activeSlide}`);
  heroCarousel.setAttribute("aria-label", `新着動画 ${activeSlide + 1}/${featuredVideos.length}`);
  heroEyebrow.textContent = `NEW TRIP · ${video.tags[0].toUpperCase()}`;
  heroTitle.textContent = video.title;
  heroDescription.textContent = video.description;
  heroWatch.href = `video.html?id=${encodeURIComponent(video.id)}`;
  heroNumber.textContent = String(activeSlide + 1).padStart(2, "0");
  heroCarousel.style.setProperty("--hero-image", `url("${video.thumbnail}")`);

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
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
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

  renderCarousel();
  startCarousel();
}

function toggleLike(id) {
  const likes = readLikes();
  saveLikes(likes.includes(id)
    ? likes.filter((item) => item !== id)
    : [...likes, id]);
  renderVideos();
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

  const favorite = document.createElement("button");
  const isLiked = readLikes().includes(video.id);
  favorite.className = `favorite-card-button${isLiked ? " active" : ""}`;
  favorite.type = "button";
  favorite.textContent = isLiked ? "♥" : "♡";
  favorite.setAttribute("aria-label", isLiked ? "いいねを取り消す" : "いいねする");
  favorite.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleLike(video.id);
  });
  visual.append(favorite);

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
  const likes = readLikes();
  const filtered = videos
    .filter((video) => selectedTag === "すべて" || video.tags.includes(selectedTag))
    .filter((video) => !showLikesOnly || likes.includes(video.id))
    .sort((a, b) => sortSelect.value === "popular"
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
likesFilter.addEventListener("click", () => {
  showLikesOnly = !showLikesOnly;
  likesFilter.setAttribute("aria-pressed", String(showLikesOnly));
  renderVideos();
});

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
