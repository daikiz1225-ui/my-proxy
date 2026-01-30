export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("Kick Proxy Online.");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': origin
            }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");

        if (contentType.includes('text/html')) {
            let html = await response.text();
            const proxyBase = "/api/proxy?url=";

            // HTML内のURLを書き換え
            html = html.replace(/(src|href|srcset|action)="([^"]+)"/g, (match, attr, val) => {
                try {
                    const fullUrl = new URL(val, origin).href;
                    const enc = Buffer.from(fullUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="${proxyBase}${enc}"`;
                } catch(e) { return match; }
            });

            // ★白い画面対策：JavaScriptの通信をすべて強制ジャックするスクリプトを注入
            const inject = `
            <script>
            (function() {
                const P_URL = "/api/proxy?url=";
                const encode = (u) => btoa(u).replace(/\\//g, '_').replace(/\\+/g, '-');

                // 1. Fetchをジャック
                const orgFetch = window.fetch;
                window.fetch = function(u, i) {
                    if (typeof u === 'string' && u.startsWith('http') && !u.includes(location.host)) {
                        u = P_URL + encode(u);
                    }
                    return orgFetch(u, i);
                };

                // 2. XMLHttpRequest(Ajax)をジャック
                const orgOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(m, u) {
                    if (typeof u === 'string' && u.startsWith('http') && !u.includes(location.host)) {
                        u = P_URL + encode(u);
                    }
                    return orgOpen.apply(this, arguments);
                };

                // 3. エラーで止まらないように見守る
                window.onerror = function() { return true; };
            })();
            </script>`;

            // <head> の直後に注入して、他のどのプログラムよりも先に動かす
            return res.send(html.replace('<head>', '<head>' + inject));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("Error: " + e.message);
    }
}
