import { createCard, fetchVideos } from "./shared.js";

const grid = document.querySelector("#video-grid");
const tagFilters = document.querySelector("#tag-filters");
const count = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const sortSelect = document.querySelector("#sort-select");

let videos = [];
let selectedTag = "すべて";

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

sortSelect.addEventListener("change", renderVideos);

fetchVideos()
  .then((data) => {
    videos = data;
    renderTags();
    renderVideos();
  })
  .catch(() => {
    emptyState.textContent = "動画データを読み込めませんでした。";
    emptyState.hidden = false;
  });
