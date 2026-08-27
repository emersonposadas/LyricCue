const storageKey = "lyriccue.customSongs.v1";
const publishedSongsPath = "songs.json";

const starterSongs = [
  {
    id: "warmup-cue",
    title: "Warmup Cue",
    artist: "LyricCue",
    builtIn: true,
    lyrics: `[Intro]
Breathe in, settle the room
Count four, listen together

[Verse]
First line lands clear and steady
Second line waits for the snare
Keep the vowel open
Keep the ending light

[Chorus]
Lift the phrase
Hold the center
Let the harmony arrive

[Bridge]
Eyes forward
Shoulders easy
Come back in on the downbeat`
  },
  {
    id: "setlist-marker",
    title: "Setlist Marker",
    artist: "LyricCue",
    builtIn: true,
    lyrics: `[Cue]
Guitar starts alone
Keys enter after two bars

[Verse 1]
Lead vocal stays close
Backing vocals answer low
Watch the drummer for the lift

[Chorus]
Everyone in
Big consonants
Cut together on the last word

[Outro]
Repeat softly
Slow the final line
End on the hand signal`
  }
];

const els = {
  songSelect: document.querySelector("#songSelect"),
  deleteSong: document.querySelector("#deleteSong"),
  saveSong: document.querySelector("#saveSong"),
  songTitle: document.querySelector("#songTitle"),
  songArtist: document.querySelector("#songArtist"),
  lyricEditor: document.querySelector("#lyricEditor"),
  fontSize: document.querySelector("#fontSize"),
  fontSizeValue: document.querySelector("#fontSizeValue"),
  scrollSpeed: document.querySelector("#scrollSpeed"),
  scrollSpeedValue: document.querySelector("#scrollSpeedValue"),
  lineHeight: document.querySelector("#lineHeight"),
  lineHeightValue: document.querySelector("#lineHeightValue"),
  playPause: document.querySelector("#playPause"),
  playIcon: document.querySelector("#playIcon"),
  playLabel: document.querySelector("#playLabel"),
  restart: document.querySelector("#restart"),
  fullscreen: document.querySelector("#fullscreen"),
  stageWrap: document.querySelector(".stage-wrap"),
  stage: document.querySelector("#stage"),
  stageTitle: document.querySelector("#stageTitle"),
  stageArtist: document.querySelector("#stageArtist"),
  statusPill: document.querySelector("#statusPill"),
  lyricsDisplay: document.querySelector("#lyricsDisplay"),
  themeButtons: [...document.querySelectorAll("[data-theme]")]
};

let songs = [...starterSongs];
let selectedId = starterSongs[0].id;
let isPlaying = false;
let lastFrame = 0;
let animationId = null;
let scrollCeiling = 0;
let promptOffset = 0;
let settingsFrame = null;

async function loadSongs() {
  const publishedSongs = await loadPublishedSongs();
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  songs = [...publishedSongs, ...saved];
  selectedId = songs[0]?.id || starterSongs[0].id;
}

async function loadPublishedSongs() {
  try {
    const response = await fetch(publishedSongsPath, { cache: "no-store" });
    if (!response.ok) throw new Error("Song library unavailable");
    const data = await response.json();
    const library = Array.isArray(data) ? data : data.songs;

    if (!Array.isArray(library) || library.length === 0) {
      return starterSongs;
    }

    const loadedSongs = await Promise.all(
      library.map((song, index) => loadLibrarySong(song, index))
    );

    return loadedSongs.filter(Boolean);
  } catch {
    return starterSongs;
  }
}

async function loadLibrarySong(song, index) {
  if (song.file) {
    try {
      const response = await fetch(song.file, { cache: "no-store" });
      if (!response.ok) throw new Error("Song file unavailable");
      const parsed = parseSongText(await response.text(), song.file);

      return {
        id: song.id || parsed.id || slugify(parsed.title, index),
        title: song.title || parsed.title,
        artist: song.artist || parsed.artist,
        lyrics: parsed.lyrics,
        builtIn: true
      };
    } catch {
      return null;
    }
  }

  if (!song.title || !song.lyrics) return null;

  return {
    id: song.id || slugify(song.title, index),
    title: song.title,
    artist: song.artist || "",
    lyrics: song.lyrics,
    builtIn: true
  };
}

function parseSongText(text, filePath) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const metadata = {};
  let lyricStart = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/^([A-Za-z]+):\s*(.*)$/);

    if (!match) {
      lyricStart = line.trim() === "" ? index + 1 : index;
      break;
    }

    metadata[match[1].toLowerCase()] = match[2].trim();
    lyricStart = index + 1;
  }

  const fallbackTitle = filePath
    .split("/")
    .pop()
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ");

  return {
    id: metadata.id,
    title: metadata.title || fallbackTitle,
    artist: metadata.artist || "",
    lyrics: lines.slice(lyricStart).join("\n").trim()
  };
}

function saveCustomSongs() {
  localStorage.setItem(
    storageKey,
    JSON.stringify(songs.filter((song) => !song.builtIn))
  );
}

function renderSongOptions() {
  els.songSelect.innerHTML = "";

  songs.forEach((song) => {
    const option = document.createElement("option");
    option.value = song.id;
    option.textContent = song.artist ? `${song.title} - ${song.artist}` : song.title;
    els.songSelect.append(option);
  });

  els.songSelect.value = selectedId;
}

function currentSong() {
  return songs.find((song) => song.id === selectedId) || songs[0];
}

function selectSong(id) {
  selectedId = id;
  const song = currentSong();
  els.songTitle.value = song.title;
  els.songArtist.value = song.artist || "";
  els.lyricEditor.value = song.lyrics;
  els.stageTitle.textContent = song.title;
  els.stageArtist.textContent = song.artist || "Unknown artist";
  els.deleteSong.disabled = Boolean(song.builtIn);
  els.deleteSong.style.opacity = song.builtIn ? "0.45" : "1";
  renderLyrics(song.lyrics);
  restartScroll();
  renderSongOptions();
}

function renderLyrics(text) {
  els.lyricsDisplay.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const lines = text.split("\n");

  lines.forEach((line, index) => {
    const node = document.createElement("div");
    const trimmed = line.trim();
    const isSection = trimmed.startsWith("[") && trimmed.endsWith("]");

    if (isSection) {
      node.className = "section";
      node.textContent = trimmed.slice(1, -1);
    } else {
      node.textContent = line || "\u00a0";
    }

    fragment.append(node);
    if (index !== lines.length - 1) {
      fragment.append(document.createTextNode("\n"));
    }
  });

  els.lyricsDisplay.append(fragment);
}

function slugify(value, index) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || `song-${index + 1}`;
}

function updateTypography() {
  const progress = getScrollProgress();
  const fontSize = `${els.fontSize.value}px`;
  const lineHeight = (Number(els.lineHeight.value) / 100).toFixed(2);

  document.documentElement.style.setProperty("--lyrics-size", fontSize);
  document.documentElement.style.setProperty("--lyrics-line", lineHeight);
  els.fontSizeValue.value = fontSize;
  els.lineHeightValue.value = lineHeight;
  scheduleStageSync(progress);
}

function updateSpeedLabel() {
  els.scrollSpeedValue.value = `${els.scrollSpeed.value} px/s`;
  if (isPlaying) {
    lastFrame = performance.now();
  }
}

function scheduleStageSync(progress = getScrollProgress()) {
  if (settingsFrame) {
    cancelAnimationFrame(settingsFrame);
  }

  settingsFrame = requestAnimationFrame(() => {
    settingsFrame = null;
    scrollCeiling = getMaxScroll();
    setPromptOffset(progress * scrollCeiling);

    if (!isPlaying && promptOffset <= 1) {
      els.statusPill.textContent = "Ready";
    }
  });
}

function setPlaying(nextState) {
  const maxScroll = getMaxScroll();
  if (nextState && maxScroll <= 0) {
    els.statusPill.textContent = "Fits";
    return;
  }

  if (nextState && promptOffset >= maxScroll - 2) {
    setPromptOffset(0);
  }

  isPlaying = nextState;
  els.playIcon.textContent = isPlaying ? "Ⅱ" : "▶";
  els.playLabel.textContent = isPlaying ? "Pause" : "Start";
  els.statusPill.textContent = isPlaying ? "Rolling" : "Ready";

  if (isPlaying) {
    lastFrame = performance.now();
    scrollCeiling = maxScroll;
    animationId = requestAnimationFrame(scrollLoop);
  } else if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function scrollLoop(timestamp) {
  if (!isPlaying) return;

  const elapsed = (timestamp - lastFrame) / 1000;
  lastFrame = timestamp;
  scrollCeiling = getMaxScroll();
  setPromptOffset(promptOffset + Number(els.scrollSpeed.value) * elapsed);

  const nearEnd = promptOffset >= scrollCeiling - 2;

  if (nearEnd) {
    setPlaying(false);
    els.statusPill.textContent = "Done";
    return;
  }

  animationId = requestAnimationFrame(scrollLoop);
}

function getMaxScroll() {
  const stageHeight = els.stage.clientHeight;
  const lyricHeight = els.lyricsDisplay.offsetHeight;
  return Math.max(stageHeight * 0.85, lyricHeight - stageHeight * 0.62);
}

function getScrollProgress() {
  const maxScroll = getMaxScroll();
  return maxScroll > 0 ? promptOffset / maxScroll : 0;
}

function setPromptOffset(value) {
  promptOffset = Math.max(0, Math.min(value, getMaxScroll()));
  document.documentElement.style.setProperty("--prompt-shift", `${-promptOffset}px`);
}

function restartScroll() {
  setPromptOffset(0);
  if (isPlaying) {
    setPlaying(false);
  }
  els.statusPill.textContent = "Ready";
}

function nudgePrompt(delta) {
  setPromptOffset(promptOffset + delta);
  if (!isPlaying) {
    const maxScroll = getMaxScroll();
    els.statusPill.textContent = promptOffset >= maxScroll - 2 ? "Done" : "Paused";
  }
}

function saveSong() {
  const title = els.songTitle.value.trim() || "Untitled Cue";
  const artist = els.songArtist.value.trim();
  const lyrics = els.lyricEditor.value.trimEnd();
  const active = currentSong();

  if (active.builtIn) {
    const newSong = {
      id: `custom-${Date.now()}`,
      title,
      artist,
      lyrics,
      builtIn: false
    };
    songs.push(newSong);
    selectedId = newSong.id;
  } else {
    active.title = title;
    active.artist = artist;
    active.lyrics = lyrics;
  }

  saveCustomSongs();
  renderSongOptions();
  selectSong(selectedId);
}

function deleteSong() {
  const active = currentSong();
  if (active.builtIn) return;

  songs = songs.filter((song) => song.id !== active.id);
  selectedId = songs[0].id;
  saveCustomSongs();
  selectSong(selectedId);
}

els.songSelect.addEventListener("change", (event) => selectSong(event.target.value));
els.saveSong.addEventListener("click", saveSong);
els.deleteSong.addEventListener("click", deleteSong);
els.lyricEditor.addEventListener("input", () => {
  const title = els.songTitle.value.trim() || currentSong().title;
  els.stageTitle.textContent = title;
  renderLyrics(els.lyricEditor.value);
});
els.songTitle.addEventListener("input", () => {
  els.stageTitle.textContent = els.songTitle.value.trim() || "Untitled Cue";
});
els.songArtist.addEventListener("input", () => {
  els.stageArtist.textContent = els.songArtist.value.trim() || "Unknown artist";
});
els.fontSize.addEventListener("input", updateTypography);
els.lineHeight.addEventListener("input", updateTypography);
els.scrollSpeed.addEventListener("input", updateSpeedLabel);
window.addEventListener("resize", scheduleStageSync);
document.addEventListener("fullscreenchange", scheduleStageSync);
els.playPause.addEventListener("click", () => setPlaying(!isPlaying));
els.restart.addEventListener("click", restartScroll);
els.stage.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    setPromptOffset(promptOffset + event.deltaY);
    if (!isPlaying) {
      els.statusPill.textContent = promptOffset > 0 ? "Paused" : "Ready";
    }
  },
  { passive: false }
);
els.fullscreen.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    els.stageWrap.requestFullscreen();
  }
});
els.themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.body.dataset.theme = button.dataset.theme;
    els.themeButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-checked", String(active));
    });
  });
});
window.addEventListener("keydown", (event) => {
  if (event.target.matches("textarea, input, select")) return;

  const largeStep = Math.max(120, els.stage.clientHeight * 0.45);

  switch (event.key) {
    case " ":
    case "Spacebar":
      event.preventDefault();
      setPlaying(!isPlaying);
      break;
    case "ArrowDown":
      event.preventDefault();
      nudgePrompt(42);
      break;
    case "ArrowUp":
      event.preventDefault();
      nudgePrompt(-42);
      break;
    case "PageDown":
      event.preventDefault();
      nudgePrompt(largeStep);
      break;
    case "PageUp":
      event.preventDefault();
      nudgePrompt(-largeStep);
      break;
    case "Home":
      event.preventDefault();
      restartScroll();
      break;
    case "End":
      event.preventDefault();
      setPromptOffset(getMaxScroll());
      if (!isPlaying) {
        els.statusPill.textContent = "Done";
      }
      break;
    default:
      if (event.key.toLowerCase() === "r") {
        restartScroll();
      }
  }
});

async function init() {
  document.body.dataset.theme = "stage";
  if (window.matchMedia("(max-width: 860px)").matches) {
    els.fontSize.value = "44";
  }

  await loadSongs();
  renderSongOptions();
  selectSong(selectedId);
  updateTypography();
  updateSpeedLabel();
}

init();
