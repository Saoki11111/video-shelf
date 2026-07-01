import { createCard, fetchVideos } from "./shared.js";

const detail = document.querySelector("#detail");
const errorState = document.querySelector("#error-state");
const player = document.querySelector("#player");
const title = document.querySelector("#detail-title");
const date = document.querySelector("#detail-date");
const description = document.querySelector("#detail-description");
const tags = document.querySelector("#detail-tags");
const downloadButton = document.querySelector("#detail-download");
const nextVideos = document.querySelector("#next-videos");
const nextVideosGrid = document.querySelector("#next-videos-grid");
const id = new URLSearchParams(location.search).get("id");

function getRandomVideos(videos, currentVideoId) {
  const candidates = videos.filter((video) => video.id !== currentVideoId);
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[randomIndex]] = [candidates[randomIndex], candidates[index]];
  }
  return candidates.slice(0, 3);
}

function showNextVideos() {
  if (!nextVideos) return;
  nextVideos.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start"
  });
}

function renderVideo(video, videos) {
  document.title = `${video.title} | Video Log`;
  title.textContent = video.title;
  date.textContent = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long"
  }).format(new Date(`${video.publishedAt}T00:00:00`));
  description.textContent = video.description;

  if (video.downloadUrl) {
    downloadButton.href = video.downloadUrl;
    downloadButton.hidden = false;
  } else {
    downloadButton.hidden = true;
  }

  video.tags.forEach((tag) => {
    const item = document.createElement("span");
    item.textContent = `#${tag}`;
    tags.append(item);
  });

  if (video.videoUrl) {
    const videoElement = document.createElement("video");
    videoElement.src = video.videoUrl;
    videoElement.controls = true;
    videoElement.playsInline = true;
    videoElement.preload = "metadata";
    videoElement.poster = video.thumbnail;
    videoElement.addEventListener("ended", showNextVideos);
    player.append(videoElement);
  } else {
    const unavailable = document.createElement("p");
    unavailable.className = "player-unavailable";
    unavailable.textContent = "この動画は再生準備中です。";
    player.append(unavailable);
  }

  if (nextVideosGrid) {
    nextVideosGrid.replaceChildren(...getRandomVideos(videos, video.id).map(createCard));
  }
  detail.hidden = false;
}

fetchVideos()
  .then((videos) => {
    const video = videos.find((item) => item.id === id);
    if (!video) {
      errorState.textContent = "動画が見つかりません。";
      errorState.hidden = false;
      return;
    }
    renderVideo(video, videos);
  })
  .catch(() => {
    errorState.textContent = "動画データを読み込めませんでした。";
    errorState.hidden = false;
  });
