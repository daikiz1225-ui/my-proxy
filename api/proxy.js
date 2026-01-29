export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(200).send("Proxy is Alive!");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)',
                'Referer': 'https://www.youtube.com/'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        // HTMLの場合だけ、中身を書き換える（ここで全部やる）
        if (contentType.includes('text/html')) {
            let html = await response.text();
            const origin = new URL(decodedUrl).origin;

            // YouTube偽装 ＆ リンク変換 ＆ 広告消し を一気に注入
            const script = `
            <script>
                Object.defineProperty(navigator, 'onLine', { get: () => true });
                setInterval(() => {
                    if (window.ytcfg) {
                        window.ytcfg.set('CONNECTED', true);
                        window.ytcfg.set('OFFLINE_MODE', false);
                    }
                }, 500);
                document.querySelectorAll('a').forEach(a => {
                    if(a.href && !a.href.includes(location.host)) {
                        try {
                            const abs = new URL(a.href, "${origin}").href;
                            a.href = "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                        } catch(e) {}
                    }
                });
            </script>
            <style>#player-ads, .ad-slot, #masthead-ad { display: none !important; }</style>`;

            html = html.replace('<head>', '<head>' + script);
            return res.send(html);
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        // ここでエラー内容をブラウザに出し切る！
        return res.status(500).send("Debug Error: " + e.message);
    }
}
