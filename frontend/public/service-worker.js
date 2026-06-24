importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

if (workbox) {
  console.log(`Workbox is loaded`);

  // 缓存静态资源 (JS, CSS, Images)
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'script' ||
                   request.destination === 'style' ||
                   request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // 缓存 HTML 页面 (Navigation requests)
  workbox.routing.registerRoute(
    ({request}) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
        }),
      ],
    })
  );

  // 默认离线回退 (如果需要)
  workbox.recipes.offlineFallback();
} else {
  console.log(`Workbox didn't load`);
}
