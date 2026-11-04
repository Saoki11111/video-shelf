import { createCard, fetchVideos } from "./shared.js";

const summary = document.querySelector("#timeline-summary");
const timeline = document.querySelector("#timeline");
const emptyState = document.querySelector("#timeline-empty");
const tagFilters = document.querySelector("#tag-filters");
const tagCarouselPrev = document.querySelector("#tag-carousel-prev");
const tagCarouselNext = document.querySelector("#tag-carousel-next");

let videos = [];
const selectedTags = new Set();

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
    renderTags();
    renderTimeline();
  })
  .catch(() => {
    emptyState.textContent = "動画データを読み込めませんでした。";
    emptyState.hidden = false;
  });
