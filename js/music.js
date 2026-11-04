import { fetchVideos } from "./shared.js";

const groupsRoot = document.querySelector("#music-groups");
const emptyState = document.querySelector("#music-empty");

function getTracks(video) {
  if (!video.music) return [];
  return Array.isArray(video.music) ? video.music : [video.music];
}

function createTrackRow(video, track) {
  const card = document.createElement("div");
  card.className = "music-card";

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

  const used = document.createElement("p");
  used.className = "music-used";
  used.append("使用動画：");
  const videoLink = document.createElement("a");
  videoLink.href = `video.html?id=${encodeURIComponent(video.id)}`;
  videoLink.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l11-6.5z"/></svg>';
  videoLink.append(video.title);
  used.append(videoLink);
  info.append(used);

  card.append(info);

  if (track.url) {
    const link = document.createElement("a");
    link.className = "music-link";
    link.href = track.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.innerHTML = '<svg viewBox="0 0 384 512" aria-hidden="true" focusable="false"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg><span>music</span>';
    link.setAttribute("aria-label", `${track.title} を Apple Music で聴く`);
    card.append(link);
  }

  const cardLink = document.createElement("a");
  cardLink.className = "music-card-link";
  cardLink.href = `video.html?id=${encodeURIComponent(video.id)}`;
  cardLink.setAttribute("aria-label", `${video.title} を見る`);
  card.append(cardLink);

  return card;
}

fetchVideos()
  .then((videos) => {
    const entries = [];
    videos.forEach((video) => {
      getTracks(video).forEach((track) => entries.push({ video, track }));
    });

    if (entries.length === 0) {
      emptyState.textContent = "使用曲はまだありません。";
      emptyState.hidden = false;
      return;
    }

    const groups = new Map();
    entries.forEach((entry) => {
      const artist = entry.track.artist || "その他";
      if (!groups.has(artist)) groups.set(artist, []);
      groups.get(artist).push(entry);
    });

    const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
    const fragment = document.createDocumentFragment();
    ordered.forEach(([artist, items]) => {
      const heading = document.createElement("h2");
      heading.className = "music-artist-name";
      heading.append(artist);
      const count = document.createElement("span");
      count.textContent = `${items.length}曲`;
      heading.append(count);

      const list = document.createElement("div");
      list.className = "music-tracks";
      list.append(...items.map(({ video, track }) => createTrackRow(video, track)));

      fragment.append(heading, list);
    });
    groupsRoot.append(fragment);
  })
  .catch(() => {
    emptyState.hidden = false;
  });
