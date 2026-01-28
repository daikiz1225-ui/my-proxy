self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    // 自分のドメインやプロキシ済みURLはそのまま
    if (url.includes(location.host) || url.startsWith('data:')) return;

    // 外への通信をすべてプロキシへ誘導
    const proxyUrl = '/proxy/' + encodeURI(url);
    event.respondWith(
        fetch(proxyUrl, {
            headers: event.request.headers,
            mode: 'cors'
        }).catch(() => fetch(event.request))
    );
});
