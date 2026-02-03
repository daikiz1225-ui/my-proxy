export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.send("Kick Search Proxy: Ready");

    try {
        const target = Buffer.from(id.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(target, {
            headers: { 
                // 学校のiPadでもよく使われる「標準的なブラウザ」のふりを徹底する
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                'Cache-Control': 'max-age=0'
            }
        });

        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        if (ct.includes('html')) {
            let html = await response.text();
            const origin = new URL(target).origin;

            // リンクの書き換え（ここが怪しまれないように慎重に）
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    const abs = new URL(val, origin).href;
                    // JSやCSSはそのまま読み込ませた方が、サイト側の「広告ブロックチェック」をパスしやすい
                    if (attr === 'src' && /\.(js|css|png|jpg|gif)/.test(abs)) return `${attr}="${abs}"`;
                    
                    const enc = btoa(unescape(encodeURIComponent(abs))).replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?id=${enc}"`;
                } catch { return m; }
            });
            
            return res.send(html);
        }

        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        return res.status(500).send("Kick Search System Error: " + e.message);
    }
}
