self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes(location.host) || !url.startsWith('http')) return;

    // 「無効な反応」の原因になりやすいYouTubeの広告・分析ドメインをカット
    if (url.includes('googleads') || url.includes('doubleclick')) {
        event.respondWith(new Response('', { status: 204 }));
        return;
    }

    const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
    event.respondWith(
        fetch('/proxy/' + b64, {
            headers: event.request.headers,
            credentials: 'include'
        }).catch(() => fetch(event.request))
    );
});
