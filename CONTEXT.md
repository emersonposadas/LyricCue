# LyricCue Context

## Project

LyricCue is a static rehearsal lyric prompter intended for GitHub Pages. It shows large, high-contrast lyrics that can auto-scroll slowly for singers or musicians during rehearsal.

The app is intentionally plain HTML, CSS, and JavaScript. There is no build step, framework, or backend.

## Current Goals

- Make lyrics readable from roughly 1 meter away.
- Keep the interface polished, fast, and natural for rehearsal.
- Let the user select pre-made songs from a dropdown.
- Support quick paste/edit use through the built-in editor.
- Keep publishing simple through GitHub Pages.

## Architecture

- `index.html`: static app markup.
- `styles.css`: complete responsive UI and stage styling.
- `app.js`: song loading, lyric rendering, prompter controls, keyboard shortcuts, and local custom-song storage.
- `songs.json`: static song index loaded by the app.
- `songs/*.txt`: plain text song files with optional metadata.
- `.nojekyll`: ensures GitHub Pages serves files directly.

## Song Format

Pre-made songs should be added as plain text files inside `songs/`.

```text
Title: Song Title
Artist: Artist Name

Paste the lyrics here exactly as they should appear.
Blank lines are preserved.
```

Then register the file in `songs.json`:

```json
{
  "id": "song-id",
  "file": "songs/song-file.txt"
}
```

The app reads `Title:` and `Artist:` from the text file. If title is missing, it falls back to the file name.

## Interaction Notes

- Fullscreen targets only the stage area so the side controls are hidden.
- Auto-scroll uses a transform-based prompter offset instead of native container scrolling.
- Settings update live: font size, spacing, and speed are recalculated as the user changes controls.
- Custom pasted songs are stored only in browser `localStorage`; pre-made songs should be committed to the repo.

## Keyboard Controls

- `Space`: pause or resume.
- `Arrow Down` / `Arrow Up`: move the lyrics a little.
- `Page Down` / `Page Up`: move the lyrics more.
- `Home`: restart from the top.
- `End`: jump to the end.
- `R`: restart from the top.

## Publishing

Use GitHub Pages from the repository root. Since this is a static site, GitHub Pages can serve `index.html`, `songs.json`, and `songs/*.txt` directly.
