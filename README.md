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

## Mobile use and browser tests

Playback, restart, fullscreen, and speed controls sit below the lyric stage and stay visible in portrait and landscape. Swipe vertically on the lyrics to move the prompt manually. Scroll outside the lyric stage to reach the song editor and typography settings. Rotating the device preserves progress. Fullscreen keeps the transport visible and falls back to an expanded stage when the browser cannot fullscreen an element.

Run the regression suite:

```bash
npm install
npx playwright install chromium
npm test
```

To use an existing Chrome installation instead:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome npm test
```

Tests cover portrait (390×844), landscape (844×390 and 932×430), and desktop (1440×900): control visibility, actual lyric movement, speed changes, pause/restart, rotation during playback, native and fallback fullscreen, and malformed browser storage. Mobile projects also exercise touch swipes and tapping the speed slider. Layout screenshots are written to `test-results/`.

These are automated Chrome mobile-emulation tests; physical Android/iPhone testing and iOS Safari validation remain separate checks.

## Lectura a distancia

En **Modo de lectura**, selecciona **Una pantalla** para mostrar toda la canción o
**Dos columnas** para repartir estrofas completas: primero se lee la columna
izquierda, luego la derecha. El tamaño se ajusta automáticamente al espacio
 disponible, también al cambiar de orientación o entrar en pantalla completa.
El control de espaciado sigue disponible; el tamaño manual y la reproducción
se habilitan de nuevo al volver a **Desplazamiento**.

**Colores por estrofa** alterna cuatro colores de alto contraste. Separa los
segmentos con líneas en blanco o encabezados como `[Coro]`. Los colores se
adaptan al fondo claro de Paper y se pueden desactivar. Para canciones largas,
el ajuste puede producir letra pequeña: usa pantalla completa o desplazamiento
si necesitas letras mayores para leer a distancia.

## Escuchar canciones

Añade una propiedad opcional `"url"` a la canción en `songs.json`:

```json
{
  "id": "me-persigue-tu-sombra",
  "file": "songs/me-persigue-tu-sombra.txt",
  "url": "https://www.youtube.com/watch?v=ULxcmMgsxf4"
}
```

El reproductor aparece debajo del selector de canciones. Pulsa play en el vídeo;
**Start** sigue controlando únicamente el desplazamiento de la letra. Cambiar de
canción detiene el vídeo anterior. Las copias guardadas con **Save** conservan el enlace.
Se admiten enlaces de YouTube `watch`, `youtu.be`, `shorts`, `live` y `embed`.
En móvil, el reproductor está en el panel debajo de la letra; en pantalla completa
el panel queda fuera de la vista y la música puede seguir sonando.

Se requiere conexión a YouTube y que el vídeo permita reproducción embebida.
Si YouTube impide reproducirlo, usa **Abrir en YouTube**. Ejecuta la aplicación
con `npm run dev` para probarla en `http://localhost:4173`.

El selector **Velocidad de la canción** muestra las velocidades admitidas por el
vídeo de YouTube y se sincroniza con su menú de reproducción. La API embebida no
permite garantizar incrementos arbitrarios de 0,1. La velocidad musical y la del
desplazamiento de la letra son independientes.

En pantalla completa, los botones **Música: Play, Pause y Stop** controlan
YouTube. **Pause** conserva la posición; **Stop** pausa y vuelve al principio.
Se habilitan cuando el reproductor está listo y funcionan también con la
pantalla completa alternativa del móvil. No modifican el desplazamiento de la letra.

**Ir al inicio** vuelve al segundo cero del vídeo sin cambiar entre reproducción y pausa.
