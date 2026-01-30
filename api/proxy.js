export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("Kick Proxy Online.");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const contentType = response.headers.get('content-type') || '';

        // HTML以外（画像など）は普通に返す
        if (!contentType.includes('text/html')) {
            res.setHeader('Content-Type', contentType);
            const ab = await response.arrayBuffer();
            return res.send(Buffer.from(ab));
        }

        // --- HTMLの場合：超・強制表示モード ---
        let html = await response.text();
        const proxyBase = "/api/proxy?url=";

        // 1. URLの書き換え
        html = html.replace(/(src|href|srcset|action)="([^"]+)"/ig, (match, attr, val) => {
            try {
                const fullUrl = new URL(val, origin).href;
                const enc = Buffer.from(fullUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                return `${attr}="${proxyBase}${enc}"`;
            } catch(e) { return match; }
        });

        // 2. ブラウザの「ダウンロード」を黙らせる究極のスクリプト
        // ページを一度真っ白にして、自分自身をDataURIとして再描画する
        const forceDisplayScript = `
        <script>
        if (!window.location.href.includes('data:')) {
            const content = document.documentElement.outerHTML;
            // 自分の通信をジャック
            window.stop();
            document.open();
            document.write(content);
            document.close();
        }
        </script>`;

        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.setHeader('Content-Disposition', 'inline');
        return res.send(forceDisplayScript + html);

    } catch (e) {
        return res.status(500).send("Error: " + e.message);
    }
}
