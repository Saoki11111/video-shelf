import { createCard, fetchVideos } from "./shared.js";

const summary = document.querySelector("#timeline-summary");
const timeline = document.querySelector("#timeline");
const emptyState = document.querySelector("#timeline-empty");
const tagFilters = document.querySelector("#tag-filters");
const sortSelect = document.querySelector("#sort-select");

let videos = [];
let selectedTag = "すべて";
let viewCounts = {};

function renderTags() {
  tagFilters.replaceChildren();
  const tags = ["すべて", ...new Set(videos.flatMap((video) => video.tags))];

  tags.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tag-button${tag === selectedTag ? " active" : ""}`;
    button.textContent = tag;
    button.setAttribute("aria-pressed", String(tag === selectedTag));
    button.addEventListener("click", () => {
      selectedTag = tag;
      renderTags();
      renderTimeline();
    });
    tagFilters.append(button);
  });
}

function renderTimeline() {
  timeline.replaceChildren();

  const filtered = videos
    .filter((video) => selectedTag === "すべて" || video.tags.includes(selectedTag))
    .sort((a, b) => sortSelect.value === "popular"
      ? (viewCounts[b.id] ?? 0) - (viewCounts[a.id] ?? 0)
        || b.publishedAt.localeCompare(a.publishedAt)
      : b.publishedAt.localeCompare(a.publishedAt));

  if (sortSelect.value === "popular") {
    summary.textContent = selectedTag === "すべて"
      ? `${filtered.length}本 / 人気順`
      : `${selectedTag}で ${filtered.length}本 / 人気順`;

    if (filtered.length === 0) {
      emptyState.textContent = "該当する動画はありません。";
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    const section = document.createElement("section");
    section.className = "timeline-year";
    const heading = document.createElement("div");
    heading.className = "timeline-heading";
    const title = document.createElement("h2");
    title.textContent = "人気順";
    const note = document.createElement("p");
    note.textContent = `${filtered.length}本`;
    heading.append(title, note);
    const grid = document.createElement("div");
    grid.className = "video-grid timeline-grid";
    grid.append(...filtered.map(createCard));
    section.append(heading, grid);
    timeline.append(section);
    return;
  }

  const grouped = new Map();
  filtered.forEach((video) => {
    const year = new Date(`${video.publishedAt}T00:00:00`).getFullYear();
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year).push(video);
  });

  const years = [...grouped.keys()].sort((a, b) => b - a);
  summary.textContent = selectedTag === "すべて"
    ? `${filtered.length}本 / ${years.length}年`
    : `${selectedTag}で ${filtered.length}本 / ${years.length}年`;

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
    grid.append(...grouped.get(year).map(createCard));

    section.append(heading, grid);
    fragment.append(section);
  });

  timeline.append(fragment);
}

sortSelect.addEventListener("change", renderTimeline);

Promise.all([
  fetchVideos(),
  fetch("api/views")
    .then((response) => response.ok ? response.json() : { views: {} })
    .catch(() => ({ views: {} }))
])
  .then(([data, popularity]) => {
    videos = data;
    viewCounts = popularity.views ?? {};
    renderTags();
    renderTimeline();
  })
  .catch(() => {
    emptyState.textContent = "動画データを読み込めませんでした。";
    emptyState.hidden = false;
  });
