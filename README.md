# LyricCue

LyricCue is a static rehearsal lyric prompter with large, high-contrast text, automatic scrolling, fitted reading modes, and embedded YouTube playback. It uses plain HTML, CSS, and JavaScript, with no backend or build step.

**Live app:** [emersonposadas.github.io/LyricCue](https://emersonposadas.github.io/LyricCue/)

## Run locally

Use a local HTTP server so the app can fetch the song library and text files. Opening `index.html` directly with `file://` is not a supported way to load the library.

With Node.js/npm and Python 3 installed:

```bash
npm run dev
```

Or use Python 3 directly:

```bash
python3 -m http.server 4173
```

Open [localhost:4173](http://localhost:4173). Installing npm dependencies is only necessary for the browser tests.

## Reading and rehearsal

Select a song, then choose **Modo de lectura**:

| Mode | Behavior |
| --- | --- |
| **Desplazamiento** | Scrolls the lyrics at an adjustable speed. **Text** sets the font size; **Start/Pause** controls scrolling. |
| **Una pantalla** | Fits the entire song into the available stage area. |
| **Dos columnas** | Default view. Fits complete verses into two columns, read left to right. |

Fitted modes resize the text automatically when the viewport changes or fullscreen starts. They use compact margins and hide the scrolling speed and Start controls. **Spacing** remains adjustable; manual font size is disabled until you return to scrolling. Long songs can still require small text: use fullscreen or scrolling to improve readability at a distance.

**Colores por estrofa** alternates four high-contrast verse colors. Blank lines and bracketed headings such as `[Coro]` separate segments. Each blank line in the text file keeps one line of vertical space, including multiple blank lines between verses; indentation and spaces within lyric lines are preserved. Choose **Stage**, **Paper**, or **Warm** for the background theme; verse colors adapt to Paper. Colors can also be disabled.

Scroll the mouse wheel or drag/swipe the lyric area to move through the prompt manually. The **Restart** button resets the lyrics and pauses scrolling. Rotation and viewport resizing preserve scrolling progress.

## YouTube playback

Songs with a supported `url` show a YouTube player below the song selector. Press play inside the video to listen. Changing songs removes the previous player and stops its audio.

**Velocidad de la canción** lists the playback rates offered by the loaded video and follows changes made in YouTube's own controls. It is disabled until the player is ready or when only normal speed is available. Arbitrary increments of 0.1 are not guaranteed; only the rates returned by the player are offered.

Music playback and lyric scrolling are independent. **Start**, **Speed**, and the lyric **Restart** button do not control YouTube. There is no automatic synchronization of lyrics to the recording.

### Fullscreen music controls

Fullscreen shows the lyric stage and its controls, hiding the control panel and embedded video. The music can continue playing. These buttons appear under **Música** in both native fullscreen and the expanded-stage fallback:

| Button | YouTube action |
| --- | --- |
| **Play** | Starts or resumes the video. |
| **Pause** | Pauses and keeps the current position. |
| **Ir al inicio** | Returns to the beginning while preserving playback or pause. |
| **Stop** | Pauses and returns to the beginning. |

Music buttons are disabled until the player is ready, when no supported video URL is available, or when the player reports an error. Exit fullscreen to change the song or music speed.

### Availability and troubleshooting

YouTube playback requires an internet connection and a video that permits embedding. If a video cannot play inside LyricCue, use **Abrir en YouTube**. LyricCue does not collect account credentials, manage subscriptions, or remove advertisements.

On desktop, the player is in the left control panel. On mobile, that panel is below the lyric stage: scroll outside the lyrics to reach it. The embedded video itself is intentionally outside the fullscreen stage.

If an update appears missing, refresh the page with **Ctrl+Shift+R** (or **Cmd+Shift+R** on macOS). The HTML references versioned JavaScript and CSS URLs to reduce stale asset caching.

## Song library and editing

The published library currently contains six songs plus an alternate backing-track entry, each with a YouTube URL:

- Me Persigue Tu Sombra — Alegres de Terán
- Total Ya Se Fue — Los Invasores De Nuevo León
- Hermosísimo Lucero — Alegres de Terán
- Flor De Capomo — Carlos y José
- Eslabón por Eslabón — Los Invasores De Nuevo León (original and **[PISTA]** versions)
- La Chona — Los Tucanes de Tijuana

Lyrics load exclusively from `songs/*.txt`, indexed in `songs.json`. The lyric editor, title/artist inputs, and Save/Delete buttons have been removed. Previously saved browser songs are no longer loaded.

### Add a published song

Create a UTF-8 text file under `songs/`:

```text
Title: My Song
Artist: Artist Name

[Verse]
First line
Second line

[Chorus]
Chorus lyrics
```

Register it in the `songs` array in `songs.json`. For example, the existing La Chona entry is:

```json
{
  "id": "la-chona",
  "file": "songs/la-chona.txt",
  "url": "https://www.youtube.com/watch?v=ULxcmMgsxf4"
}
```

Use a unique `id` and the matching file path for a new song. The `url` is optional. Supported YouTube link formats include `watch?v=`, `youtu.be`, `shorts`, `live`, and `embed`. Other providers are not supported.

The loader reads `Title:` and `Artist:` from the text file; the filename supplies a fallback title. Library entries can also supply title and artist overrides. If no files can be loaded, the app displays an empty library message.

### Reuse lyrics with a different video

Multiple entries can reference the same text file. Give each entry a unique `id`
and set `title` in `songs.json` to distinguish the version in the dropdown and
stage heading, without changing the shared text file:

```json
{
  "id": "eslabon-por-eslabon-pista",
  "title": "Eslabón por Eslabón [PISTA]",
  "file": "songs/eslabon-por-eslabon.txt",
  "url": "https://www.youtube.com/watch?v=_5W93Ec1TE8"
}
```

The original entry can keep its existing video URL and inherit its title from
the text file. Editing that file updates the lyrics for both versions.

Commit the text file and `songs.json` to publish the song.

## Keyboard shortcuts

Click the lyric stage before using these shortcuts. They control the lyrics, not the music, and are ignored while an input, selector, button, or link has focus. The YouTube iframe handles its own keyboard input.

| Key | Action |
| --- | --- |
| **Space** | Pause or resume lyric scrolling. |
| **Arrow Down / Arrow Up** | Move the lyrics a small amount. |
| **Page Down / Page Up** | Move the lyrics a larger amount. |
| **Home / R** | Reset the lyrics and pause scrolling. |
| **End** | Jump to the end of the lyrics. |
| **Escape** | Leave the expanded-stage fallback; browsers handle native fullscreen exit. |

## Browser tests

Install the test dependencies and Chromium:

```bash
npm ci
npx playwright install chromium
npm test
```

Or use an installed Chrome browser after `npm ci`:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome npm test
```

Playwright starts the Python server on port 4173, or reuses one already running. Run these commands from the repository root.

Tests cover desktop (1440×900), phone portrait (390×844), and two phone landscape sizes (844×390 and 932×430):

- Lyric scrolling, speed, pause/restart, rotation, touch gestures, and theme changes.
- Fitted text, intact verse ordering, two-column layout, and verse colors.
- Native and fallback fullscreen controls.
- Song URL handling, invalid URLs, and malformed browser storage.
- Supported music speeds and fullscreen Play, Pause, Stop, and Ir al inicio actions.

Player integration tests use intercepted embed content and a mocked YouTube API for deterministic assertions. They do not verify remote video availability, advertisements, or authenticated Premium playback. Real YouTube playback needs a separate manual smoke check. Mobile tests emulate Chrome; physical Android/iPhone and Safari checks remain separate. Layout screenshots are written to `test-results/`.

## Publishing and maintenance

The project is designed to be served directly from the repository root on GitHub Pages:

- Source: **Deploy from a branch**.
- Branch: **main**.
- Folder: **/ (root)**.

No build artifacts or server-side application are required. Push approved changes to `main` and allow GitHub Pages to finish deployment.

When changing `app.js` or `styles.css`, also update their `?v=` values in `index.html` to invalidate cached assets. The current convention uses the first 12 hexadecimal characters of each file's SHA-256 hash.

| File | Purpose |
| --- | --- |
| `index.html` | App shell, player panel, and stage controls. |
| `styles.css` | Responsive layout, themes, fitted views, and fullscreen controls. |
| `app.js` | Library loading, local editing, lyric layout/scrolling, and YouTube integration. |
| `songs.json` | Published song index and optional video URLs. |
| `songs/*.txt` | Song metadata and lyrics. |
| `tests/` | Playwright regression tests. |
| `playwright.config.js` | Browser projects and local test server. |
| `.nojekyll` | Keeps GitHub Pages serving the static project directly. |
