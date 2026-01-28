self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    // 自分のドメインへの通信や、すでにプロキシ済みのURLはスルー
    if (url.includes(location.host) || url.includes('/proxy/')) {
        return;
    }
    // それ以外の外への通信（YouTubeの画像やAPI）をすべて自分のプロキシへ誘導
    event.respondWith(
        fetch('/proxy/' + url, {
            headers: event.request.headers
        })
    );
});
