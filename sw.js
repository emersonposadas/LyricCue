const VERSION = 'lyriccue-v1';
const SHELL = `${VERSION}-shell`;
const MEDIA = `${VERSION}-media`;
const scope = self.registration.scope;
const local = path => new URL(path, scope).href;
const shellFiles = ['./', 'index.html', 'app.js', 'styles.css', 'songs.json', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(shellFiles)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('lyriccue-') && ![SHELL, MEDIA].includes(key)) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
let preparing;
self.addEventListener('message', event => {
  if (event.data?.type !== 'prepare-offline') return;
  const notify = async data => {
    for (const client of await self.clients.matchAll()) client.postMessage({ type: 'offline-progress', ...data });
  };
  if (!preparing) preparing = (async () => {
    try {
      const shell = await caches.open(SHELL);
      const catalog = await (await shell.match(local('songs.json'))).json();
      const paths = [...new Set(catalog.songs.flatMap(song => [song.file, song.audio]))];
      const cache = await caches.open(MEDIA);
      for (let i = 0; i < paths.length; i++) {
        const url = local(paths[i]);
        if (!await cache.match(url)) {
          const response = await fetch(url);
          if (!response.ok || response.status === 206) throw new Error('No se pudo descargar ' + paths[i]);
          await cache.put(url, response);
        }
        await notify({ current: i + 1, total: paths.length });
      }
      await notify({ done: true });
    } catch (error) {
      await notify({ error: `Descarga incompleta: ${error.message}. Conéctate y vuelve a intentarlo.` });
    } finally { preparing = null; }
  })();
  event.waitUntil(preparing);
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(scope)) return;
  event.respondWith((async () => {
    const cached = await caches.match(request.url);
    if (cached) {
      const range = request.headers.get('range');
      if (!range) return cached;
      // Android media seeking requires byte ranges even while offline.
      const bytes = await cached.arrayBuffer();
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.byteLength}` } });
      const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
      const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
      if (start > end || start >= bytes.byteLength) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.byteLength}` } });
      return new Response(bytes.slice(start, end + 1), { status: 206, headers: {
        'Content-Type': cached.headers.get('Content-Type') || 'audio/wav',
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${start}-${end}/${bytes.byteLength}`, 'Accept-Ranges': 'bytes'
      } });
    }
    try { return await fetch(request); }
    catch (error) {
      if (request.mode === 'navigate') return (await caches.match(local('index.html'))) || Response.error();
      throw error;
    }
  })());
});
