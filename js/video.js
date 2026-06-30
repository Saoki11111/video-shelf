const DATA_URL = "data/videos.json";

const detail = document.querySelector("#detail");
const errorState = document.querySelector("#error-state");
const player = document.querySelector("#player");
const title = document.querySelector("#detail-title");
const date = document.querySelector("#detail-date");
const description = document.querySelector("#detail-description");
const tags = document.querySelector("#detail-tags");
const id = new URLSearchParams(location.search).get("id");

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
