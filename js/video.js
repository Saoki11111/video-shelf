import { createCard, fetchVideos } from "./shared.js";

const detail = document.querySelector("#detail");
const errorState = document.querySelector("#error-state");
const player = document.querySelector("#player");
const title = document.querySelector("#detail-title");
const date = document.querySelector("#detail-date");
const description = document.querySelector("#detail-description");
const tags = document.querySelector("#detail-tags");
const nextVideos = document.querySelector("#next-videos");
const nextVideosGrid = document.querySelector("#next-videos-grid");
const id = new URLSearchParams(location.search).get("id");
const VIEW_THRESHOLD_SECONDS = 10;
const VIEW_DEDUPLICATION_MS = 24 * 60 * 60 * 1000;

function viewStorageKey(videoId) {
  return `video-log:viewed:${videoId}`;
}

function wasRecentlyCounted(videoId) {
  try {
    const countedAt = Number(localStorage.getItem(viewStorageKey(videoId)));
    return Number.isFinite(countedAt) && Date.now() - countedAt < VIEW_DEDUPLICATION_MS;
  } catch {
    return false;
  }
}

function rememberCount(videoId) {
  try {
    localStorage.setItem(viewStorageKey(videoId), String(Date.now()));
  } catch {
    // Playback should continue when storage is unavailable.
  }
}

function trackView(videoElement, videoId) {
  if (wasRecentlyCounted(videoId)) return;

  const onTimeUpdate = () => {
    if (videoElement.currentTime < VIEW_THRESHOLD_SECONDS) return;
    videoElement.removeEventListener("timeupdate", onTimeUpdate);
    fetch("api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ videoId }),
      keepalive: true
    }).then((response) => {
      if (response.ok) rememberCount(videoId);
    }).catch(() => {
      // Analytics failure must not affect playback.
    });
  };

  videoElement.addEventListener("timeupdate", onTimeUpdate);
}

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
    trackView(videoElement, video.id);
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
