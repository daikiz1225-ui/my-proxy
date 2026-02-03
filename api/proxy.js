export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.send("Kick Search Proxy: Ready");

    try {
        // Base64デコードでURLを復元
        const target = Buffer.from(id.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(target, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
            }
        });

        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        if (ct.includes('html')) {
            let html = await response.text();
            const origin = new URL(target).origin;

            // リンクと画像の書き換え（これがないと次のページに飛べない）
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    const abs = new URL(val, origin).href;
                    if (attr === 'src' && /\.(jpg|png|gif|webp|svg|css|js)/.test(abs)) return `${attr}="${abs}"`;
                    const enc = btoa(unescape(encodeURIComponent(abs))).replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?id=${enc}"`;
                } catch { return m; }
            });
            return res.send(html);
        }

        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        return res.status(500).send("Error: " + e.message);
    }
}
