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
  videoLink.textContent = video.title;
  used.append(videoLink);
  info.append(used);

  card.append(info);

  if (track.url) {
    const link = document.createElement("a");
    link.className = "music-link";
    link.href = track.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "聴く ↗";
    link.setAttribute("aria-label", `${track.title} を Apple Music で聴く`);
    card.append(link);
  }

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
