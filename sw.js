self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes(location.host) || !url.startsWith('http')) return;

    const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
    
    // リクエストを完全にコピーして、送り先だけ変える
    const modifiedRequest = new Request('/proxy/' + b64, {
        method: event.request.method,
        headers: event.request.headers,
        credentials: 'include',
        mode: 'cors'
    });

    event.respondWith(
        fetch(modifiedRequest).catch(() => fetch(event.request))
    );
});
