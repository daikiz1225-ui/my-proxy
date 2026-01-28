self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes(location.host) || !url.startsWith('http')) return;

    const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
    
    // YouTubeの内部通信であることを証明するヘッダーを偽造して追加
    const modifiedHeaders = new Headers(event.request.headers);
    modifiedHeaders.set('X-YouTube-Client-Name', '1');
    modifiedHeaders.set('X-YouTube-Client-Version', '2.20240126.00.00');

    event.respondWith(
        fetch('/proxy/' + b64, {
            method: event.request.method,
            headers: modifiedHeaders,
            credentials: 'include'
        }).catch(() => fetch(event.request))
    );
});
