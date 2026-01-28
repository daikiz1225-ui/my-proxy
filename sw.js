self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.host === location.host) return;

    // 完全に全ての通信を隠蔽
    const b64 = btoa(unescape(encodeURIComponent(event.request.url))).replace(/\//g, '_').replace(/\+/g, '-');
    event.respondWith(fetch('/api/proxy?url=' + b64));
});
