export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.send("Kick Search: Ready");

    try {
        const target = Buffer.from(id.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const urlObj = new URL(target);

        // Game8対策：リファラー偽装
        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            'Referer': urlObj.origin + '/'
        };

        const response = await fetch(target, { headers });
        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        if (ct.includes('html')) {
            let html = await response.text();
            
            // 1. Killer Scriptの注入 (最優先！)
            // <head>の一番最初に入れることで、サイトのスクリプトより先に実行させる
            const injector = `<script src="/api/killer.js"></script>`;
            html = html.replace('<head>', '<head>' + injector);

            // 2. リンク書き換え
            const origin = urlObj.origin;
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    const abs = new URL(val, origin).href;
                    // JSファイル等はそのまま読み込ませる（Killerが守ってくれるから大丈夫）
                    if (attr === 'src' && /\.(js|css|jpg|png|svg)/.test(abs)) return `${attr}="${abs}"`;
                    
                    const enc = btoa(unescape(encodeURIComponent(abs))).replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?id=${enc}"`;
                } catch { return m; }
            });

            return res.send(html);
        }

        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
