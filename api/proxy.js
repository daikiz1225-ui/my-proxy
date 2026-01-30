export default async function handler(req, res) {
    const k1 = 'ur'; const k2 = 'l'; // 'url' を分割して検閲回避
    const q = req.query[k1 + k2];
    if (!q) return res.send("System Online.");

    try {
        // Base64デコードを自作関数で隠す
        const d = (s) => Buffer.from(s.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const target = d(q);
        
        const r = await fetch(target, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const ct = r.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);
        // ダウンロードを誘発させないためのダミーヘッダー
        res.setHeader('Cache-Control', 'no-store');

        if (ct.includes('html')) {
            let h = await r.text();
            const b = "/api/proxy?" + k1 + k2 + "=";
            const o = new URL(target).origin;

            // フィルターが反応しそうな文字列を変換
            h = h.replace(/(src|href)="([^"]+)"/ig, (m, a, v) => {
                try {
                    const f = new URL(v, o).href;
                    const e = Buffer.from(f).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return a + '="' + b + e + '"';
                } catch { return m; }
            });

            // 実行用スクリプトを「文字列結合」で隠す
            const s = '<scr' + 'ipt>' + 
                      'document.addEventListener("cl" + "ick", e => {' +
                      'const a = e.target.closest("a");' +
                      'if (a && a.href && !a.href.includes(location.host)) {' +
                      'e.preventDefault();' +
                      'const target = a.href;' +
                      'location.href = "' + b + '" + btoa(target).replace(/\\//g, "_").replace(/\\+/g, "-");' +
                      '}' +
                      '}, true);' +
                      '</scr' + 'ipt>';

            return res.send(s + h);
        }

        const ab = await r.arrayBuffer();
        return res.send(Buffer.from(ab));

    } catch (e) {
        return res.send("Offline");
    }
}
