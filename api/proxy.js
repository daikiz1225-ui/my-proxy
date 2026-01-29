export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.send("Proxy is Online");

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
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();

            // 1. サーバー側書き換え
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

            // 2. ブラウザ側：Service Worker殺し ＆ オフライン偽装
            const inject = `
            <script>
                (function() {
                    // 【重要】Service Worker（オフラインの元凶）を抹殺
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(function(registrations) {
                            for(let registration of registrations) {
                                registration.unregister();
                                console.log('Service Worker Unregistered');
                            }
                        });
                    }

                    // オンライン偽装
                    Object.defineProperty(navigator, 'onLine', { get: () => true });
                    const fakeOnline = () => {
                        if (window.ytcfg) {
                            window.ytcfg.set('CONNECTED', true);
                            window.ytcfg.set('OFFLINE_MODE', false);
                            window.ytcfg.set('INNERTUBE_CONTEXT', {'client': {'hl': 'ja', 'gl': 'JP'}}); // 地域設定も強制
                        }
                        // オフライン表示のDOMを物理削除
                        const offlineMsg = document.querySelector('yt-formatted-string#message');
                        if(offlineMsg && offlineMsg.innerText.includes('オフライン')) {
                            offlineMsg.closest('#error-screen').remove();
                        }
                    };
                    setInterval(fakeOnline, 100);

                    // プロキシURL変換
                    const px = (u) => {
                        if(!u || typeof u !== 'string' || u.includes(location.host) || u.startsWith('data:')) return u;
                        try {
                            const abs = new URL(u, "${origin}").href;
                            return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                        } catch(e) { return u; }
                    };

                    const fix = () => {
                        document.querySelectorAll('img:not([data-px]), a:not([data-px]), form:not([data-px])').forEach(el => {
                            if (el.tagName === 'A') el.href = px(el.href);
                            if (el.tagName === 'IMG') el.src = px(el.src);
                            if (el.tagName === 'FORM') {
                                el.addEventListener('submit', (e) => {
                                    e.preventDefault();
                                    const fd = new URLSearchParams(new FormData(el)).toString();
                                    window.location.href = px(el.action + (el.action.includes('?') ? '&' : '?') + fd);
                                });
                            }
                            el.dataset.px = '1';
                        });
                    };
                    setInterval(fix, 1000); fix();
                })();
            </script>
            <style>
                #player-ads, .ad-slot, #masthead-ad { display: none !important; }
                /* オフライン画面をCSSでも隠す */
                .yt-upsell-dialog-renderer, #error-screen { display: none !important; }
            </style>`;

            return res.send(html.replace('<head>', '<head>' + inject));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("🚨 Error: " + e.message);
    }
}
