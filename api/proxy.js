export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("Kick Proxy Online.");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Disposition', 'inline');

        // HTMLの場合の処理
        if (contentType.includes('text/html')) {
            let html = await response.text();
            const proxyBase = "/api/proxy?url=";

            // 1. URL書き換え（正規表現をより安全に）
            html = html.replace(/(src|href|srcset|action)="([^"]+)"/ig, (match, attr, val) => {
                try {
                    const fullUrl = new URL(val, origin).href;
                    const enc = Buffer.from(fullUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="${proxyBase}${enc}"`;
                } catch(e) { return match; }
            });

            // 2. JavaScriptジャック（ホワイトアウト対策）
            const inject = `
            <script>
            (function() {
                const P_URL = "/api/proxy?url=";
                const encode = (u) => btoa(u).replace(/\\//g, '_').replace(/\\+/g, '-');
                const orgFetch = window.fetch;
                window.fetch = function(u, i) {
                    if (typeof u === 'string' && u.startsWith('http')) u = P_URL + encode(u);
                    return orgFetch(u, i);
                };
                const orgOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(m, u) {
                    if (typeof u === 'string' && u.startsWith('http')) u = P_URL + encode(u);
                    return orgOpen.apply(this, arguments);
                };
            })();
            </script>`;

            // <head>があってもなくても、とにかく一番最初にスクリプトを突っ込む
            html = inject + html;

            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            return res.send(html);
        }

        // HTML以外（画像、CSS、JS）はそのままの型で返す
        res.setHeader('Content-Type', contentType);
        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        res.setHeader('Content-Type', 'text/html');
        return res.status(500).send("Proxy Error: " + e.message);
    }
}
