self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // 自分のサーバー内のファイルや、既にBase64化されているものはスルー
    if (url.includes(location.host + '/api/proxy') || url.includes('vercel.app')) return;
    if (!url.startsWith('http')) return;

    // すべての通信をBase64に包んで /api/proxy へ飛ばす
    const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
    
    event.respondWith(
        fetch(`/api/proxy?url=${b64}`, {
            method: event.request.method,
            headers: event.request.headers,
            credentials: 'include'
        }).catch(() => fetch(event.request))
    );
});

self.addEventListener('activate', e => e.waitUntil(clients.claim()));
