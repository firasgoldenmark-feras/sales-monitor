// Service Worker — نظام مراقبة المناديب
// Offline First: يخزّن التطبيق ويعمل بدون إنترنت

const CACHE_NAME = 'gm-reps-monitor-v9-3-7';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// التثبيت: تخزين الملفات الأساسية
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS).catch(function (err) {
        // لو فشل تخزين مورد خارجي، نكمل دون توقف
        console.warn('بعض الموارد لم تُخزّن:', err);
      });
    })
  );
});

// التفعيل: حذف الكاش القديم
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

// الجلب: Cache First مع تحديث بالخلفية
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      const fetchPromise = fetch(e.request).then(function (networkRes) {
        // تحديث الكاش بالنسخة الجديدة
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(e.request, clone);
          });
        }
        return networkRes;
      }).catch(function () {
        return cached; // لا إنترنت → استخدم المخزّن
      });
      return cached || fetchPromise;
    })
  );
});
