const fetch = require('node-fetch');

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const urlObj = new URL(decodedUrl);

        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (contentType && contentType.includes('text/html')) {
            let body = await response.text();
            
            // 1. ページ内の全リンクをBase64プロキシ経由に強制変換（i-FILTER対策）
            // これにより「移動先でブロック」を回避する
            const scriptInject = `
            <script>
                const proxyUrl = (url) => "/api/proxy?url=" + btoa(unescape(encodeURIComponent(url))).replace(/\\//g, '_').replace(/\\+/g, '-');
                document.addEventListener('click', e => {
                    const a = e.target.closest('a');
                    if (a && a.href && !a.href.includes(location.host)) {
                        e.preventDefault();
                        window.location.href = proxyUrl(a.href);
                    }
                }, true);
            </script>`;
            
            // 2. HTML内の相対パスを絶対パスに置換してリンク切れ（Pokiの404）を防ぐ
            body = body.replace(/(src|href)="\/(?!\/)/g, `$1="${urlObj.origin}/`);
            body = body.replace('</head>', scriptInject + '</head>');

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(body);
        }

        const buffer = await response.buffer();
        res.setHeader('Content-Type', contentType);
        res.send(buffer);
    } catch (e) {
        res.status(500).send("Proxy Error: " + e.message);
    }
}
