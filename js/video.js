import { createCard, fetchVideos } from "./shared.js";

const detail = document.querySelector("#detail");
const errorState = document.querySelector("#error-state");
const player = document.querySelector("#player");
const title = document.querySelector("#detail-title");
const date = document.querySelector("#detail-date");
const description = document.querySelector("#detail-description");
const tags = document.querySelector("#detail-tags");
const musicSection = document.querySelector("#music-section");
const musicList = document.querySelector("#music-list");
const nextVideos = document.querySelector("#next-videos");
const nextVideosGrid = document.querySelector("#next-videos-grid");
const nextVideosPrev = document.querySelector("#next-videos-prev");
const nextVideosNext = document.querySelector("#next-videos-next");
const id = new URLSearchParams(location.search).get("id");
let nextVideosTouchStartX = 0;
let nextVideosTouchStartY = 0;
let suppressNextVideoClick = false;
let nextVideosAnimating = false;

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

function rotateNextVideos(direction) {
  if (nextVideosAnimating) return;
  const cards = [...nextVideosGrid.querySelectorAll(".video-card")];
  if (cards.length < 2) return;
  const distance = cards[0].getBoundingClientRect().width + 12;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  nextVideosAnimating = true;

  if (direction > 0) {
    nextVideosGrid.scrollTo({ left: distance, behavior: reducedMotion ? "auto" : "smooth" });
    setTimeout(() => {
      nextVideosGrid.append(cards[0]);
      nextVideosGrid.scrollLeft = 0;
      nextVideosAnimating = false;
    }, reducedMotion ? 0 : 220);
    return;
  }

  nextVideosGrid.prepend(cards.at(-1));
  nextVideosGrid.scrollLeft = distance;
  requestAnimationFrame(() => {
    nextVideosGrid.scrollTo({ left: 0, behavior: reducedMotion ? "auto" : "smooth" });
    setTimeout(() => {
      nextVideosAnimating = false;
    }, reducedMotion ? 0 : 220);
  });
}

nextVideosPrev.addEventListener("click", () => rotateNextVideos(-1));
nextVideosNext.addEventListener("click", () => rotateNextVideos(1));
nextVideosGrid.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  nextVideosTouchStartX = touch.clientX;
  nextVideosTouchStartY = touch.clientY;
}, { passive: true });
nextVideosGrid.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const distanceX = touch.clientX - nextVideosTouchStartX;
  const distanceY = touch.clientY - nextVideosTouchStartY;
  if (Math.abs(distanceX) >= 40 && Math.abs(distanceX) > Math.abs(distanceY)) {
    suppressNextVideoClick = true;
    rotateNextVideos(distanceX < 0 ? 1 : -1);
    setTimeout(() => {
      suppressNextVideoClick = false;
    }, 300);
  }
}, { passive: true });
nextVideosGrid.addEventListener("click", (event) => {
  if (!suppressNextVideoClick) return;
  event.preventDefault();
  suppressNextVideoClick = false;
});

function renderVideo(video, videos) {
  document.title = `${video.title} | Video Shelf`;
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
    player.append(videoElement);
  } else {
    const unavailable = document.createElement("p");
    unavailable.className = "player-unavailable";
    unavailable.textContent = "この動画は再生準備中です。";
    player.append(unavailable);
  }

  const tracks = video.music ? (Array.isArray(video.music) ? video.music : [video.music]) : [];
  if (musicSection && musicList && tracks.length) {
    tracks.forEach((track) => {
      const card = document.createElement(track.url ? "a" : "div");
      card.className = "music-card";
      if (track.url) {
        card.href = track.url;
        card.target = "_blank";
        card.rel = "noopener";
        card.setAttribute("aria-label", `${track.title} を Apple Music で聴く`);
      }
      if (track.thumbnail) {
        const thumb = document.createElement("img");
        thumb.className = "music-thumbnail";
        thumb.src = track.thumbnail;
        thumb.alt = "";
        thumb.width = 76;
        thumb.height = 76;
        thumb.loading = "lazy";
        card.append(thumb);
      }
      const info = document.createElement("div");
      info.className = "music-info";
      const name = document.createElement("p");
      name.className = "music-name";
      name.textContent = track.title ?? "";
      const artist = document.createElement("p");
      artist.className = "music-artist";
      artist.textContent = track.artist ?? "";
      info.append(name, artist);
      if (track.note) {
        const note = document.createElement("p");
        note.className = "music-note";
        note.textContent = track.note;
        info.append(note);
      }
      card.append(info);
      if (track.url) {
        const link = document.createElement("span");
        link.className = "music-link";
        link.setAttribute("aria-hidden", "true");
        link.innerHTML = '<svg viewBox="0 0 384 512" aria-hidden="true" focusable="false"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg><span>music</span>';
        card.append(link);
      }
      musicList.append(card);
    });
    musicSection.hidden = false;
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
