import { createCard, fetchVideos } from "./shared.js";

const summary = document.querySelector("#timeline-summary");
const timeline = document.querySelector("#timeline");
const emptyState = document.querySelector("#timeline-empty");
const yearFilters = document.querySelector("#year-filters");
const tagFilters = document.querySelector("#tag-filters");

let videos = [];
let selectedYear = "すべて";
let selectedTag = "すべて";

function getYears() {
  return [...new Set(videos.map((video) => new Date(`${video.publishedAt}T00:00:00`).getFullYear()))]
    .sort((a, b) => b - a)
    .map(String);
}

function renderYears() {
  yearFilters.replaceChildren();
  const years = ["すべて", ...getYears()];

  years.forEach((year) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tag-button${year === selectedYear ? " active" : ""}`;
    button.textContent = year === "すべて" ? year : `${year}年`;
    button.addEventListener("click", () => {
      selectedYear = year;
      renderYears();
      renderTimeline();
    });
    yearFilters.append(button);
  });
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
      renderTimeline();
    });
    tagFilters.append(button);
  });
}

function renderTimeline() {
  timeline.replaceChildren();

  const filtered = videos
    .filter((video) => selectedYear === "すべて"
      || new Date(`${video.publishedAt}T00:00:00`).getFullYear().toString() === selectedYear)
    .filter((video) => selectedTag === "すべて" || video.tags.includes(selectedTag))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const grouped = new Map();
  filtered.forEach((video) => {
    const year = new Date(`${video.publishedAt}T00:00:00`).getFullYear();
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year).push(video);
  });

  const years = [...grouped.keys()].sort((a, b) => b - a);
  const summaryParts = [];
  if (selectedYear !== "すべて") summaryParts.push(`${selectedYear}年`);
  if (selectedTag !== "すべて") summaryParts.push(selectedTag);
  summary.textContent = summaryParts.length === 0
    ? `${filtered.length}本 / ${years.length}年`
    : `${summaryParts.join("・")}で ${filtered.length}本 / ${years.length}年`;

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

fetchVideos()
  .then((data) => {
    videos = data;
    renderYears();
    renderTags();
    renderTimeline();
  })
  .catch(() => {
    emptyState.textContent = "動画データを読み込めませんでした。";
    emptyState.hidden = false;
  });
