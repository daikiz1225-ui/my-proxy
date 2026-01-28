self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes(location.host) || !url.startsWith('http')) return;

    // iPadの標準機能で安全にBase64化
    const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
    
    event.respondWith(
        fetch('/proxy/' + b64)
            .then(response => response)
            .catch(() => fetch(event.request))
    );
});
