# LyricCue

LyricCue is a static rehearsal lyric prompter for showing large, high-contrast lyrics that scroll automatically during practice. It is designed for GitHub Pages, so the project can be published directly without a build step.

## What It Does

- Shows rehearsal lyrics in a readable stage view.
- Scrolls lyrics automatically at an adjustable speed.
- Loads pre-made songs from simple text files.
- Keeps a paste/edit box for quick local rehearsal notes.
- Supports fullscreen stage mode without the editing controls.
- Offers keyboard controls for hands-off rehearsal.

## Run

Open `index.html` directly in a browser, or start a local server:

```bash
npm run dev
```

Then visit `http://localhost:4173`.

## GitHub Pages

This project is intentionally static. Publish the repository root with GitHub Pages and serve `index.html` directly. No build step, package install, or generated output is required.

Recommended GitHub Pages settings:

- Source: deploy from a branch.
- Branch: `main`.
- Folder: `/root`.

## Project Files

- `index.html`: app shell and controls.
- `styles.css`: visual design, responsive layout, contrast modes, and fullscreen stage mode.
- `app.js`: song loading, lyric rendering, auto-scroll, settings, and keyboard controls.
- `songs.json`: index of pre-made songs.
- `songs/*.txt`: plain text song files.
- `.nojekyll`: keeps GitHub Pages serving static files directly.

## Adding Songs

Pre-made songs are listed in `songs.json`, and each song can live in its own plain text file inside `songs/`.

```json
{
  "songs": [
    {
      "id": "my-song",
      "file": "songs/my-song.txt"
    }
  ]
}
```

Then create `songs/my-song.txt`:

```text
Title: My Song
Artist: Artist Name

Paste the lyrics here
Blank lines are fine
No JSON escaping is needed
```

After publishing, GitHub Pages serves `songs.json` and the text files. The app loads those songs into the dropdown automatically. The editor still saves temporary custom songs in the browser with `localStorage`.

## Features

- Song selector loaded from a static `songs.json` library and plain text song files.
- Editable lyrics for quick paste-and-rehearse use.
- Custom lyrics saved in the browser with `localStorage`.
- Smooth automatic scrolling with speed, font size, and spacing controls.
- Stage-only fullscreen mode that hides the editing controls.
- Stage, paper, and warm contrast modes.
- Restart, pause/play, fullscreen, and keyboard shortcuts.

## Keyboard

- `Space`: pause or resume.
- `Arrow Down` / `Arrow Up`: move the lyrics a little.
- `Page Down` / `Page Up`: move the lyrics more.
- `Home`: restart from the top.
- `End`: jump to the end.
- `R`: restart from the top.
