export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.send("System Active: V3 Stealth");

    // 広告ブロックリスト（コード内に直接書くことでエラーを回避）
    const adRules = {
        domains: ["googlesyndication.com", "doubleclick.net", "amazon-adsystem.com", "geniee.jp", "microad.jp"],
        selectors: [".adsbygoogle", "[id^='ad-']", "iframe[src*='ads']"]
    };

    try {
        const target = Buffer.from(id.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const response = await fetch(target, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        if (ct.includes('html')) {
            let html = await response.text();
            const origin = new URL(target).origin;

            // 広告削除
            adRules.domains.forEach(d => {
                html = html.replace(new RegExp('<script.*?src=".*?'+d+'.*?"><\\/script>', 'gi'), '');
            });

            // リンク書き換え (id方式)
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    const abs = new URL(val, origin).href;
                    if (attr === 'src' && /\.(jpg|png|gif|webp|svg)/.test(abs)) return `${attr}="${abs}"`;
                    const enc = Buffer.from(abs).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?id=${enc}"`;
                } catch { return m; }
            });

            const stealth = `<style>${adRules.selectors.join(',')}{display:none!important;}</style>
            <script>window.adsbygoogle={push:function(){}};window.ga=function(){};</script>`;
            return res.send(stealth + html);
        }
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
    } catch (e) {
        return res.status(500).send("Update Success but Site Error: " + e.message);
    }
}
