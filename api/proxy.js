export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.send("Proxy System Active.");

        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        // 【強化】POST通信などの全てのメソッドとボディをそのまま転送する
        const fetchOptions = {
            method: req.method,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': 'https://www.youtube.com/',
                'Origin': 'https://www.youtube.com/',
                'Content-Type': req.headers['content-type'] || 'application/json'
            }
        };

        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        const response = await fetch(decodedUrl, fetchOptions);
        const contentType = response.headers.get('content-type') || '';

        // 余計なセキュリティ制限を解除してiPadのブラウザを自由にする
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();

            // サーバー側で事前に全てのURLをプロキシ化
            html = html.replace(/(src|href|srcset)="([^"]+)"/g, (match, attr, val) => {
                if (val.startsWith('http') || val.startsWith('//')) {
                    const abs = val.startsWith('//') ? 'https:' + val : val;
                    if (!abs.includes(req.headers.host)) {
                        const encoded = Buffer.from(abs).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                        return `${attr}="/api/proxy?url=${encoded}"`;
                    }
                }
                return match;
            });

            const inject = `
            <script>
                (function() {
                    const PROXY = "/api/proxy?url=";
                    const enc = (u) => btoa(unescape(encodeURIComponent(new URL(u, "${origin}").href))).replace(/\\//g, '_').replace(/\\+/g, '-');

                    // 1. 通信の心臓部を完全にプロキシへ流し込む
                    const wrap = (original) => function(input, init) {
                        if (typeof input === 'string' && input.startsWith('http') && !input.includes(location.host)) {
                            input = PROXY + enc(input);
                        }
                        return original.apply(this, [input, init]);
                    };
                    window.fetch = wrap(window.fetch);

                    const open = XMLHttpRequest.prototype.open;
                    XMLHttpRequest.prototype.open = function(m, url) {
                        if (typeof url === 'string' && url.startsWith('http') && !url.includes(location.host)) {
                            url = PROXY + enc(url);
                        }
                        return open.apply(this, arguments);
                    };

                    // 2. 「オフライン」という概念をブラウザから消し去る
                    Object.defineProperty(navigator, 'onLine', { get: () => true });
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
                    }

                    // 3. YouTubeの内部フラグを「オンライン」に固定
                    setInterval(() => {
                        if (window.ytcfg) {
                            window.ytcfg.set('CONNECTED', true);
                            window.ytcfg.set('OFFLINE_MODE', false);
                        }
                        const err = document.querySelector('#error-screen, ytm-error-renderer, .yt-mode-offline');
                        if(err) err.remove();
                    }, 500);
                })();
            </script>
            <style>
                #player-ads, .ad-slot, #error-screen { display: none !important; visibility: hidden !important; }
            </style>`;

            return res.send(html.replace('<head>', '<head>' + inject));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("🚨 Fatal Error: " + e.message);
    }
}
