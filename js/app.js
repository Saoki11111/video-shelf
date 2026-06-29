const DATA_URL = "data/videos.json";
const LIKES_KEY = "video-shelf-likes";
const LEGACY_FAVORITES_KEY = "video-shelf-favorites";

const grid = document.querySelector("#video-grid");
const tagFilters = document.querySelector("#tag-filters");
const count = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const sortSelect = document.querySelector("#sort-select");
const likesFilter = document.querySelector("#likes-filter");

let videos = [];
let selectedTag = "すべて";
let showLikesOnly = false;

const readLikes = () => JSON.parse(
  localStorage.getItem(LIKES_KEY) || localStorage.getItem(LEGACY_FAVORITES_KEY) || "[]"
);
const saveLikes = (items) => localStorage.setItem(LIKES_KEY, JSON.stringify(items));
const formatDate = (date) => new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long"
}).format(new Date(`${date}T00:00:00`));

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
  visual.innerHTML = '<span class="play-mark" aria-hidden="true">▶</span>';

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
    renderTags();
    renderVideos();
  })
  .catch(() => {
    emptyState.textContent = "動画データを読み込めませんでした。";
    emptyState.hidden = false;
  });
