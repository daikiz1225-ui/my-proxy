const blockList = [
    'google-analytics.com',
    'googlesyndication.com',
    'googletagservices.com',
    'amazon-adsystem.com',
    'adnxs.com'
];

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // 広告リストに含まれるドメインなら通信を遮断
    if (blockList.some(ad => url.host.includes(ad))) {
        return event.respondWith(new Response('', { status: 204 }));
    }

    if (url.host === location.host) return;

    const b64 = btoa(unescape(encodeURIComponent(event.request.url))).replace(/\//g, '_').replace(/\+/g, '-');
    event.respondWith(fetch('/api/proxy?url=' + b64));
});
