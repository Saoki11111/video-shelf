const DATA_URL = "data/videos.json";
const FAVORITES_KEY = "video-shelf-favorites";

const detail = document.querySelector("#detail");
const errorState = document.querySelector("#error-state");
const player = document.querySelector("#player");
const title = document.querySelector("#detail-title");
const date = document.querySelector("#detail-date");
const description = document.querySelector("#detail-description");
const tags = document.querySelector("#detail-tags");
const favoriteButton = document.querySelector("#favorite-button");
const lineShare = document.querySelector("#line-share");

const id = new URLSearchParams(location.search).get("id");
const readFavorites = () => JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
const saveFavorites = (items) => localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));

function updateFavoriteButton(videoId) {
  const isFavorite = readFavorites().includes(videoId);
  favoriteButton.textContent = isFavorite ? "♥ お気に入り済み" : "♡ お気に入り";
}

function renderVideo(video) {
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

  if (video.driveFileId) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://drive.google.com/file/d/${encodeURIComponent(video.driveFileId)}/preview`;
    iframe.allow = "autoplay";
    iframe.allowFullscreen = true;
    iframe.title = `${video.title}の動画`;
    player.append(iframe);
  } else {
    const videoElement = document.createElement("video");
    videoElement.src = video.src;
    videoElement.controls = true;
    videoElement.preload = "metadata";
    player.append(videoElement);
  }

  updateFavoriteButton(video.id);
  favoriteButton.addEventListener("click", () => {
    const favorites = readFavorites();
    saveFavorites(favorites.includes(video.id)
      ? favorites.filter((item) => item !== video.id)
      : [...favorites, video.id]);
    updateFavoriteButton(video.id);
  });

  lineShare.href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(location.href)}`;
  detail.hidden = false;
}

fetch(DATA_URL)
  .then((response) => {
    if (!response.ok) throw new Error("動画データを取得できませんでした");
    return response.json();
  })
  .then((videos) => {
    const video = videos.find((item) => item.id === id);
    if (!video) throw new Error("動画が見つかりません");
    renderVideo(video);
  })
  .catch(() => {
    errorState.hidden = false;
  });
