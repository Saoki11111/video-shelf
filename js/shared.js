export const DATA_URL = "data/videos.json";

export async function fetchVideos() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error("動画データを取得できませんでした");
  return response.json();
}

export function formatMonth(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long"
  }).format(new Date(`${date}T00:00:00`));
}

export function formatYear(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

export function getDriveDownloadUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
}

export function createCard(video) {
  const card = document.createElement("article");
  card.className = "video-card";

  const link = document.createElement("a");
  link.href = `video.html?id=${encodeURIComponent(video.id)}`;
  link.setAttribute("aria-label", `${video.title}を見る`);

  const visual = document.createElement("div");
  visual.className = "card-visual";
  const thumbnail = document.createElement("img");
  thumbnail.className = "card-thumbnail";
  thumbnail.src = video.thumbnail;
  thumbnail.alt = "";
  thumbnail.loading = "lazy";
  thumbnail.decoding = "async";
  const playMark = document.createElement("span");
  playMark.className = "play-mark";
  playMark.setAttribute("aria-hidden", "true");
  playMark.textContent = "▶";
  visual.append(thumbnail, playMark);

  const body = document.createElement("div");
  body.className = "card-body";
  const tags = document.createElement("div");
  tags.className = "card-tags";
  video.tags.forEach((tag) => {
    const tagElement = document.createElement("span");
    tagElement.textContent = `#${tag}`;
    tags.append(tagElement);
  });
  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = video.title;
  const date = document.createElement("p");
  date.className = "card-date";
  date.textContent = formatMonth(video.publishedAt);

  body.append(tags, title, date);
  link.append(visual, body);
  card.append(link);
  return card;
}
