const DATA_URL = "data/videos.json";
const FAVORITES_KEY = "video-shelf-favorites";

const grid = document.querySelector("#video-grid");
const tagFilters = document.querySelector("#tag-filters");
const count = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const sortSelect = document.querySelector("#sort-select");
const favoritesFilter = document.querySelector("#favorites-filter");

let videos = [];
let selectedTag = "すべて";
let showFavoritesOnly = false;

const readFavorites = () => JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
const saveFavorites = (items) => localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
const formatDate = (date) => new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long"
}).format(new Date(`${date}T00:00:00`));

function toggleFavorite(id) {
  const favorites = readFavorites();
  saveFavorites(favorites.includes(id)
    ? favorites.filter((item) => item !== id)
    : [...favorites, id]);
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
  visual.innerHTML = '<span class="play-mark" aria-hidden="true">▶</span>';

  const favorite = document.createElement("button");
  const isFavorite = readFavorites().includes(video.id);
  favorite.className = `favorite-card-button${isFavorite ? " active" : ""}`;
  favorite.type = "button";
  favorite.textContent = isFavorite ? "♥" : "♡";
  favorite.setAttribute("aria-label", isFavorite ? "お気に入りから削除" : "お気に入りに追加");
  favorite.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(video.id);
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
  const favorites = readFavorites();
  const filtered = videos
    .filter((video) => selectedTag === "すべて" || video.tags.includes(selectedTag))
    .filter((video) => !showFavoritesOnly || favorites.includes(video.id))
    .sort((a, b) => sortSelect.value === "popular"
      ? a.sortOrder - b.sortOrder
      : b.publishedAt.localeCompare(a.publishedAt));

  grid.replaceChildren(...filtered.map(createCard));
  count.textContent = `${filtered.length}本の動画`;
  emptyState.hidden = filtered.length !== 0;
}

function renderTags() {
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
favoritesFilter.addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  favoritesFilter.setAttribute("aria-pressed", String(showFavoritesOnly));
  renderVideos();
});

fetch(DATA_URL)
  .then((response) => {
    if (!response.ok) throw new Error("動画データを取得できませんでした");
    return response.json();
  })
  .then((data) => {
    videos = data;
    renderTags();
    renderVideos();
  })
  .catch(() => {
    emptyState.textContent = "動画データを読み込めませんでした。";
    emptyState.hidden = false;
  });
