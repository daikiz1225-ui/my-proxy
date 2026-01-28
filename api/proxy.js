const fetch = require('node-fetch');

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (contentType && contentType.includes('text/html')) {
            let body = await response.text();
            
            // 1. 相対パス（/page）を絶対パス（https://site.com/page）に修正
            body = body.replace(/(src|href|action)="\/(?!\/)/g, `$1="${origin}/`);
            
            // 2. さらにそれらをプロキシ経由（/api/proxy?url=Base64...）に誘導するスクリプトを注入
            body = body.replace('<head>', `<head><script>
                // ページ内のすべてのクリックを監視してプロキシ経由にする
                window.onclick = e => {
                    const a = e.target.closest('a');
                    if (a && a.href && !a.href.includes(location.host)) {
                        e.preventDefault();
                        const b64 = btoa(unescape(encodeURIComponent(a.href))).replace(/\\//g, '_').replace(/\\+/g, '-');
                        window.location.href = "/api/proxy?url=" + b64;
                    }
                };
            </script>`);

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(body);
        }

        const buffer = await response.buffer();
        res.setHeader('Content-Type', contentType);
        res.send(buffer);
    } catch (e) {
        res.status(500).send(e.message);
    }
}
