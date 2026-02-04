export default async function handler(req, res) {
    const { v } = req.query;

    // 対策スクリプト（setupモード）
    if (v === 'setup') {
        res.setHeader('Content-Type', 'application/javascript');
        return res.send(`
            (function() {
                const keywords = ['広告','表示','許可','ブロッカー','Adblock'];
                setInterval(() => {
                    document.querySelectorAll('div,section,iframe,article').forEach(el => {
                        keywords.forEach(k => {
                            if (el.innerText && el.innerText.includes(k)) {
                                el.remove();
                                document.body.style.overflow = 'auto';
                            }
                        });
                    });
                }, 500);
            })();
        `);
    }

    if (!v) return res.send("System Online");

    try {
        const target = Buffer.from(v.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const urlObj = new URL(target);

        const response = await fetch(target, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': urlObj.origin + '/'
            }
        });

        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        if (ct.includes('html')) {
            let html = await response.text();
            
            // 対策コード注入
            const scriptTag = '<script src="/api/data?v=setup"></script>';
            html = html.replace('<head>', '<head>' + scriptTag);

            // 全リンクをこの data.js を通すように書き換え
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    if (val.startsWith('#') || val.startsWith('javascript')) return m;
                    const abs = new URL(val, urlObj.origin).href;
                    if (attr === 'src' && /\.(js|css|png|jpg|gif|svg|woff)/i.test(abs)) return attr + '="' + abs + '"';
                    const enc = btoa(unescape(encodeURIComponent(abs))).replace(/\//g, '_').replace(/\+/g, '-');
                    return attr + '="/api/data?v=' + enc + '"';
                } catch { return m; }
            });
            return res.send(html);
        }
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
    } catch (e) { return res.status(404).send(""); }
}
