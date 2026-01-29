export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.send("Proxy System Ready.");

        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        // 【最強のなりすまし】YouTubeが「本物のブラウザだ」と思い込むヘッダー
        const forwardHeaders = {
            'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': '*/*',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            'Referer': 'https://www.youtube.com/',
            'Origin': 'https://www.youtube.com/',
            'X-Youtube-Client-Name': '2', // iPad (Mobile Web)
            'X-Youtube-Client-Version': '2.20240130.01.00'
        };

        const fetchOptions = {
            method: req.method,
            headers: forwardHeaders,
            redirect: 'follow'
        };

        // POSTデータの転送をより確実に
        if (req.method === 'POST') {
            fetchOptions.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
        }

        const response = await fetch(decodedUrl, fetchOptions);
        const contentType = response.headers.get('content-type') || '';

        // ブラウザの制限を全て解除
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();
            
            // サーバー側で全てのリンクをプロキシ経由に書き換え
            const proxyBase = "/api/proxy?url=";
            html = html.replace(/(src|href|srcset)="([^"]+)"/g, (match, attr, val) => {
                if (val.startsWith('http') || val.startsWith('//')) {
                    const abs = val.startsWith('//') ? 'https:' + val : val;
                    if (!abs.includes(req.headers.host)) {
                        const enc = Buffer.from(abs).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                        return `${attr}="${proxyBase}${enc}"`;
                    }
                }
                return match;
            });

            const inject = `
            <script>
                (function() {
                    const P_URL = "/api/proxy?url=";
                    const enc = (u) => btoa(unescape(encodeURIComponent(new URL(u, "${origin}").href))).replace(/\\//g, '_').replace(/\\+/g, '-');

                    // 全てのFetch通信をプロキシに強制転送
                    const orgFetch = window.fetch;
                    window.fetch = function(u, i) {
                        if (typeof u === 'string' && u.startsWith('http') && !u.includes(location.host)) {
                            u = P_URL + enc(u);
                        }
                        return orgFetch(u, i);
                    };

                    // オフライン状態を殺す
                    Object.defineProperty(navigator, 'onLine', { get: () => true });
                    setInterval(() => {
                        if (window.ytcfg) {
                            window.ytcfg.set('CONNECTED', true);
                            window.ytcfg.set('OFFLINE_MODE', false);
                        }
                        // エラー画面を強制非表示
                        document.querySelectorAll('#error-screen, ytm-error-renderer').forEach(el => el.remove());
                    }, 100);
                })();
            </script>`;

            return res.send(html.replace('<head>', '<head>' + inject));
        }

        // バイナリデータ（画像・動画）を返す
        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("🚨 Error: " + e.message);
    }
}
