export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.send("Proxy is Ready. Please input URL.");

        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': 'https://www.youtube.com/',
                'Origin': 'https://www.youtube.com/'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        // セキュリティ制限（CSP）を解除して、僕らのスクリプトが自由に動けるようにする
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();

            // サーバー側で事前に全てのURLをプロキシ化（爆速化の要）
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

                    // 1. Service Workerを徹底的に無効化（オフラインの元凶）
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.register = () => new Promise(() => {}); // 登録させない
                        navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
                    }

                    // 2. 全ての通信（fetch/XHR）を強制プロキシ
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

                    // 3. YouTubeのシステムを「常にオンライン」に固定
                    Object.defineProperty(navigator, 'onLine', { get: () => true });
                    setInterval(() => {
                        if (window.ytcfg) {
                            window.ytcfg.set('CONNECTED', true);
                            window.ytcfg.set('OFFLINE_MODE', false);
                        }
                        // オフライン画面を物理的に消去し続ける
                        const err = document.querySelector('#error-screen, ytm-error-renderer, .yt-mode-offline');
                        if(err) err.remove();
                    }, 100);

                    // 4. 動的なリンクと画像をリアルタイムで書き換え
                    new MutationObserver(() => {
                        document.querySelectorAll('a:not([data-px]), img:not([data-px])').forEach(el => {
                            const a = el.tagName === 'A' ? 'href' : 'src';
                            if (el[a] && el[a].startsWith('http') && !el[a].includes(location.host)) {
                                el[a] = PROXY + enc(el[a]);
                                el.dataset.px = '1';
                            }
                        });
                    }).observe(document.documentElement, { childList: true, subtree: true });
                })();
            </script>
            <style>
                #player-ads, .ad-slot, #masthead-ad, ytm-promoted-video-renderer { display: none !important; }
                #error-screen { display: none !important; visibility: hidden !important; }
            </style>`;

            return res.send(html.replace('<head>', '<head>' + inject));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("🚨 Fatal Error: " + e.message);
    }
}
