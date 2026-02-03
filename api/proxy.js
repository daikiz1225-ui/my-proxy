import adRules from './adblock.json'; // 新しいファイルを読み込む

export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.send("System Active with AdBlock");

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

            // --- 🚫 外部ファイル(JSON)を使った動的ブロック ---
            adRules.blockedDomains.forEach(domain => {
                const escaped = domain.replace(/\./g, '\\.');
                const regex = new URL(target).origin.includes(domain) ? null : new RegExp(`<script.*?src=".*?${escaped}.*?"><\\/script>`, 'gi');
                if (regex) html = html.replace(regex, '');
            });

            // --- 🔗 リンクと画像の書き換え ---
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    const abs = new URL(val, origin).href;
                    if (attr === 'src' && /\.(jpg|png|gif|webp|svg)/.test(abs)) return `${attr}="${abs}"`;
                    const enc = Buffer.from(abs).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?id=${enc}"`;
                } catch { return m; }
            });

            // --- 🛡️ iPad側でも広告を消すための「追い打ち」スクリプト ---
            const stealthScript = `
            <style>
                ${adRules.blockedSelectors.join(', ')} { display: none !important; }
            </style>
            <script>
                // 広告ブロック検知を回避するフェイク
                window.adsbygoogle = window.adsbygoogle || [];
                window.ga = function() {};
            </script>`;

            return res.send(stealthScript + html);
        }

        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        return res.status(404).send("Not Found");
    }
}
