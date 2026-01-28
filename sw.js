self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes(location.host) || !url.startsWith('http')) return;

    // YouTubeの心臓部（API）への通信を「本物のiPad」に見せかける
    const b64 = btoa(unescape(encodeURIComponent(url))).replace(/\//g, '_').replace(/\+/g, '-');
    
    const secureRequest = new Request('/proxy/' + b64, {
        method: event.request.method,
        headers: {
            ...Object.fromEntries(event.request.headers),
            'X-YouTube-Client-Name': '1',
            'X-YouTube-Client-Version': '2.20240126.00.00',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/'
        },
        credentials: 'include',
        mode: 'cors'
    });

    event.respondWith(
        fetch(secureRequest).catch(() => fetch(event.request))
    );
});
