import { fetchVideos } from "./shared.js";

let videos = [];

const CHEVRON_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEVRON_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function getTracks(video) {
  if (!video.music) return [];
  return Array.isArray(video.music) ? video.music : [video.music];
}

function renderMusicPick() {
  const wrap = document.querySelector(".top-sections");
  if (!wrap) return;

  const entries = [];
  videos.forEach((video) => {
    getTracks(video).forEach((track) => entries.push({ video, track }));
  });
  if (!entries.length) return;

  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const selected = shuffled.slice(0, 3);

  const section = document.createElement("section");
  section.className = "shelf";
  section.setAttribute("aria-label", "Sound & Movie");

  const heading = document.createElement("div");
  heading.className = "section-heading";
  const headingText = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "MUSIC CHOICE";
  const title = document.createElement("h2");
  title.textContent = "Sound & Movie";
  const note = document.createElement("p");
  note.className = "shelf-note";
  note.textContent = "聞いてほしい曲、動画を彩る音楽たち";
  headingText.append(eyebrow, title, note);
  const pageLink = document.createElement("a");
  pageLink.className = "section-link";
  pageLink.href = "music.html";
  pageLink.textContent = "使用曲一覧 →";
  heading.append(headingText, pageLink);

  const stage = document.createElement("div");
  stage.className = "pick-stage";
  const cardLink = document.createElement("a");
  cardLink.className = "pick-card";
  stage.append(cardLink);

  const nav = document.createElement("div");
  nav.className = "pick-nav";
  const dots = document.createElement("div");
  dots.className = "pick-dots";
  const count = document.createElement("span");
  count.className = "pick-count";
  const arrows = document.createElement("div");
  arrows.className = "pick-arrows";
  const prev = document.createElement("button");
  prev.type = "button";
  prev.setAttribute("aria-label", "前の曲");
  prev.innerHTML = CHEVRON_LEFT;
  const next = document.createElement("button");
  next.type = "button";
  next.setAttribute("aria-label", "次の曲");
  next.innerHTML = CHEVRON_RIGHT;
  arrows.append(prev, next);
  nav.append(dots, count, arrows);
  stage.append(nav);

  let index = 0;
  function show(nextIndex) {
    index = ((nextIndex % selected.length) + selected.length) % selected.length;
    const { video, track } = selected[index];
    cardLink.href = `video.html?id=${encodeURIComponent(video.id)}`;
    cardLink.setAttribute("aria-label", `${track.title}が使われている動画「${video.title}」を見る`);
    cardLink.replaceChildren();

    if (track.thumbnail) {
      const backdrop = document.createElement("img");
      backdrop.className = "pick-backdrop";
      backdrop.src = track.thumbnail;
      backdrop.alt = "";
      backdrop.setAttribute("aria-hidden", "true");
      const jacket = document.createElement("img");
      jacket.className = "pick-jacket";
      jacket.src = track.thumbnail;
      jacket.alt = "";
      jacket.loading = "lazy";
      cardLink.append(backdrop, jacket);
    }

    const info = document.createElement("div");
    info.className = "pick-info";
    const song = document.createElement("p");
    song.className = "pick-song";
    song.textContent = `♪ ${track.title ?? ""}`;
    const artist = document.createElement("p");
    artist.className = "pick-artist";
    artist.textContent = track.artist ?? "";
    info.append(song, artist);
    if (track.note) {
      const noteEl = document.createElement("p");
      noteEl.className = "pick-note";
      noteEl.textContent = track.note;
      info.append(noteEl);
    }
    const used = document.createElement("p");
    used.className = "pick-video";
    used.textContent = `使用動画：${video.title}`;
    info.append(used);
    cardLink.append(info);

    cardLink.classList.remove("pick-fade");
    void cardLink.offsetWidth;
    cardLink.classList.add("pick-fade");

    dots.replaceChildren(...selected.map((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      if (i === index) dot.className = "on";
      dot.setAttribute("aria-label", `${i + 1}曲目を表示`);
      dot.addEventListener("click", () => show(i));
      return dot;
    }));
    count.textContent = `${index + 1} / ${selected.length}`;
  }
  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => show(index + 1));

  let pickTouchX = 0;
  let pickTouchY = 0;
  let suppressPickClick = false;
  cardLink.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    pickTouchX = touch.clientX;
    pickTouchY = touch.clientY;
  }, { passive: true });
  cardLink.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - pickTouchX;
    const distanceY = touch.clientY - pickTouchY;
    if (Math.abs(distanceX) >= 50 && Math.abs(distanceX) > Math.abs(distanceY)) {
      suppressPickClick = true;
      show(index + (distanceX < 0 ? 1 : -1));
    }
  }, { passive: true });
  cardLink.addEventListener("click", (event) => {
    if (suppressPickClick) {
      suppressPickClick = false;
      event.preventDefault();
    }
  });

  show(0);

  section.append(heading, stage);
  wrap.append(section);
}

fetchVideos()
  .then((data) => {
    videos = data;
    renderMusicPick();
  })
  .catch(() => {
    const wrap = document.querySelector(".top-sections");
    if (wrap) {
      const message = document.createElement("p");
      message.className = "shelf-note";
      message.textContent = "動画データを読み込めませんでした。";
      wrap.append(message);
    }
  });
