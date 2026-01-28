const fetch = require('node-fetch');

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const urlObj = new URL(decodedUrl);

        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (contentType && contentType.includes('text/html')) {
            let body = await response.text();
            
            // 1. 基本的なURLのズレを修正
            body = body.replace('<head>', `<head><base href="${urlObj.origin}${urlObj.pathname}">`);

            // 2. ページ内のリンク・ボタン・フォーム送信をすべて横取りしてBase64化する最強スクリプト
            const proxyScript = `
            <script>
                const encodeProxy = (url) => {
                    if(!url || url.startsWith('data:') || url.startsWith('javascript:')) return url;
                    try { 
                        const absolute = new URL(url, document.baseURI).href;
                        if (absolute.includes(location.host)) return url;
                        return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(absolute))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    } catch(e) { return url; }
                };

                // すべてのクリックを監視
                document.addEventListener('click', e => {
                    const el = e.target.closest('a, button, [onclick]');
                    if (el && el.href && !el.href.includes(location.host)) {
                        e.preventDefault();
                        window.location.href = encodeProxy(el.href);
                    }
                }, true);

                // フォーム送信も横取り
                document.addEventListener('submit', e => {
                    const form = e.target;
                    if (form.action && !form.action.includes(location.host)) {
                        e.preventDefault();
                        const target = encodeProxy(form.action);
                        const method = form.method.toUpperCase();
                        window.location.href = target + (method === 'GET' ? '?' + new URLSearchParams(new FormData(form)).toString() : '');
                    }
                }, true);
            </script>`;

            body = body.replace('</head>', proxyScript + '</head>');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(body);
        }

        const buffer = await response.buffer();
        res.setHeader('Content-Type', contentType);
        res.send(buffer);
    } catch (e) {
        res.status(500).send("Proxy Error: " + e.message);
    }
}
