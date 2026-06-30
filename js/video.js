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

  if (video.driveFileId) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://drive.google.com/file/d/${encodeURIComponent(video.driveFileId)}/preview?autoplay=1&mute=1`;
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
