// LifeTracker Service Worker
// 使用原生 Cache API 实现，不依赖 Workbox CDN（避免国内无法访问 Google CDN）
// 策略：
// - 静态资源（JS/CSS/图片）：StaleWhileRevalidate
// - 页面导航（HTML）：NetworkFirst，失败时回退缓存
// - GET API 请求（物品/待办列表等）：NetworkFirst，失败时回退缓存，离线可展示数据
// - 安装时预缓存根页面

const STATIC_CACHE = 'lt-static-v1';
const PAGES_CACHE = 'lt-pages-v1';
const API_CACHE = 'lt-api-v1';

// 静态资源类型判断
function isStaticAsset(request) {
  return (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  );
}

// StaleWhileRevalidate：先返回缓存，同时后台更新
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      // 仅缓存有效响应
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

// NetworkFirst：优先网络，失败回退缓存，最终回退 offline.html
async function networkFirst(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // 全部失败：尝试回退到根页面缓存
    const rootCache = await cache.match('/');
    if (rootCache) return rootCache;
    // 最终回退：离线提示页
    const offlineCache = await cache.match('/offline.html');
    if (offlineCache) return offlineCache;
    throw err;
  }
}

// API 请求 NetworkFirst：优先网络，失败回退缓存，离线时仍可展示数据
async function apiNetworkFirst(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    // 仅缓存成功的 JSON 响应，避免缓存错误响应
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // 网络失败：尝试从缓存读取
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.addAll(['/', '/offline.html']))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGES_CACHE && key !== API_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // 仅处理同源 GET 请求（POST/PUT/DELETE 不缓存）
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 页面导航：NetworkFirst
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  // GET API 请求：NetworkFirst，离线时回退缓存
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(apiNetworkFirst(request));
    return;
  }
  // 静态资源：StaleWhileRevalidate
  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  // 其他请求：直接走网络
});
