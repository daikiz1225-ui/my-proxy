export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.send("Proxy is Online");

        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();

            // --- [サーバー側での爆速書き換え処理] ---
            // 1. 画像URLを正規表現で一括置換（ブラウザに届く前にプロキシ化）
            html = html.replace(/(src|href|srcset)="([^"]+)"/g, (match, attr, val) => {
                if (val.startsWith('http') || val.startsWith('//')) {
                    const abs = val.startsWith('//') ? 'https:' + val : val;
                    if (!abs.includes(req.headers.host)) {
                        const encoded = Buffer.from(abs).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                        return `${attr}="/api/proxy?url=${encoded}"`;
                    }
                }
                return match;
            });

            // 2. ブラウザ側で動く補助スクリプト（動的読み込み用）
            const inject = `
            <script>
                (function() {
                    Object.defineProperty(navigator, 'onLine', { get: () => true });
                    const px = (u) => {
                        if(!u || typeof u !== 'string' || u.includes(location.host) || u.startsWith('data:')) return u;
                        return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(new URL(u, "${origin}").href))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    };
                    // 後から出てきた要素だけ対応
                    setInterval(() => {
                        document.querySelectorAll('img:not([data-px]), a:not([data-px])').forEach(el => {
                            if(el.src) el.src = px(el.src);
                            if(el.href) el.href = px(el.href);
                            el.dataset.px = '1';
                        });
                    }, 2000);
                })();
            </script>`;

            return res.send(html.replace('<head>', '<head>' + inject));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("Error: " + e.message);
    }
}
