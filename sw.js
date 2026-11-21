// 経営学 一問一答 オフライン対応 Service Worker
// HTML（ナビゲーション）はネットワーク優先：サイトの更新が端末に届くようにする。取得に失敗したとき（通信制限中・オフライン）はキャッシュを返す
// それ以外のファイルは cache-first: 一度読み込んだファイルは端末に保存し、通信制限中・オフラインでも開けるようにする
const CACHE_NAME = 'keiei-quiz-v2';
const PRECACHE_URLS = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const accept = event.request.headers.get('accept') || '';
  const isHtml = event.request.mode === 'navigate' || accept.indexOf('text/html') !== -1;
  if (isHtml) {
    // ネットワーク優先：最新を取得できたらそれを返し、キャッシュも更新する。失敗時はキャッシュにフォールバック
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() =>
        caches.match(event.request, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          return caches.match('./index.html', { ignoreSearch: true });
        })
      )
    );
    return;
  }
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
