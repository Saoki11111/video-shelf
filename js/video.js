import { fetchVideos, getDriveDownloadUrl } from "./shared.js";

const detail = document.querySelector("#detail");
const errorState = document.querySelector("#error-state");
const player = document.querySelector("#player");
const title = document.querySelector("#detail-title");
const date = document.querySelector("#detail-date");
const description = document.querySelector("#detail-description");
const tags = document.querySelector("#detail-tags");
const downloadButton = document.querySelector("#detail-download");
const id = new URLSearchParams(location.search).get("id");

function renderVideo(video) {
  document.title = `${video.title} | Video Log`;
  title.textContent = video.title;
  date.textContent = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long"
  }).format(new Date(`${video.publishedAt}T00:00:00`));
  description.textContent = video.description;

  if (video.driveFileId) {
    downloadButton.href = getDriveDownloadUrl(video.driveFileId);
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
    player.append(videoElement);
  } else {
    const unavailable = document.createElement("p");
    unavailable.className = "player-unavailable";
    unavailable.textContent = "この動画は再生準備中です。";
    player.append(unavailable);
  }

  detail.hidden = false;
}

fetchVideos()
  .then((videos) => {
    const video = videos.find((item) => item.id === id);
    if (!video) throw new Error("動画が見つかりません");
    renderVideo(video);
  })
  .catch(() => {
    errorState.hidden = false;
  });
