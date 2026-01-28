self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes(location.host) || !url.startsWith('http')) return;

    // URLをBase64化して安全に運ぶ
    const b64 = btoa(url).replace(/\//g, '_').replace(/\+/g, '-');
    event.respondWith(
        fetch('/proxy/' + b64, { headers: event.request.headers })
    );
});
