import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.send("System Active with AdBlock");

    // --- 🚫 外部ルール(JSON)の読み込み ---
    let adRules = { blockedDomains: [], blockedSelectors: [] };
    try {
        const jsonPath = path.join(process.cwd(), 'api', 'adblock.json');
        const fileData = fs.readFileSync(jsonPath, 'utf8');
        adRules = JSON.parse(fileData);
    } catch (e) {
        console.error("JSON Load Error:", e);
        // ファイルが読めなくても止まらないように空リストで続行
    }

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

            // 広告ドメインの削除
            adRules.blockedDomains.forEach(domain => {
                const escaped = domain.replace(/\./g, '\\.');
                const regex = new RegExp(`<script.*?src=".*?${escaped}.*?"><\\/script>`, 'gi');
                html = html.replace(regex, '');
            });

            // リンクと画像の書き換え
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    const abs = new URL(val, origin).href;
                    if (attr === 'src' && /\.(jpg|png|gif|webp|svg)/.test(abs)) return `${attr}="${abs}"`;
                    const enc = Buffer.from(abs).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?id=${enc}"`;
                } catch { return m; }
            });

            // CSSによる非表示
            const stealthScript = `
            <style>
                ${adRules.blockedSelectors.join(', ')} { display: none !important; }
            </style>
            <script>
                window.adsbygoogle = window.adsbygoogle || [];
                window.adsbygoogle.push = function() {};
            </script>`;

            return res.send(stealthScript + html);
        }

        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        return res.status(404).send("Not Found");
    }
}
