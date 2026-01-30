export default async function handler(req, res) {
    const { url: q } = req.query;
    // URLがなければDuckDuckGo Liteへ
    const target = q ? Buffer.from(q.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString() 
                     : "https://html.duckduckgo.com/html/";

    try {
        const r = await fetch(target, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const ct = r.headers.get('content-type') || '';
        
        // --- 画像やCSSはブラウザにキャッシュさせて高速化 ---
        if (!ct.includes('html')) {
            res.setHeader('Content-Type', ct);
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1日キャッシュ
            const ab = await r.arrayBuffer();
            return res.send(Buffer.from(ab));
        }

        // --- HTMLの場合：URL奪取スクリプトを注入 ---
        let h = await r.text();
        const o = new URL(target).origin;

        // 1. 全てのリンク・画像をプロキシ経由に一括変換（画像の高速化処理含む）
        h = h.replace(/(src|href)="([^"]+)"/ig, (m, attr, val) => {
            try {
                const fullUrl = new URL(val, o).href;
                // 画像(jpg, png, gif)なら変換せず直接表示させて速度を稼ぐ（i-FILTERが画像単体まで止めていない場合）
                if (attr === 'src' && /\.(jpg|jpeg|png|gif|svg|webp)/i.test(fullUrl)) {
                    return `${attr}="${fullUrl}"`;
                }
                const enc = Buffer.from(fullUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                return `${attr}="/api/proxy?url=${enc}"`;
            } catch { return m; }
        });

        // 2. タップした瞬間に「本当のURL」を奪うスクリプト
        const stealer = `
        <script>
        document.addEventListener('click', e => {
            const a = e.target.closest('a');
            if (a && a.href && !a.href.includes(location.host)) {
                e.preventDefault();
                let rawUrl = a.href;
                // DuckDuckGoの転送URL(uddg)があれば抽出
                if (rawUrl.includes('uddg=')) {
                    const params = new URLSearchParams(new URL(rawUrl).search);
                    rawUrl = params.get('uddg');
                }
                const enc = btoa(unescape(encodeURIComponent(rawUrl))).replace(/\\//g, '_').replace(/\\+/g, '-');
                window.location.href = "/api/proxy?url=" + enc;
            }
        }, true);
        </script>`;

        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        return res.send(stealer + h);

    } catch (e) {
        return res.send("Error");
    }
}
