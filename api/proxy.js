export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.send("Proxy is Ready");

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

            // サーバー側で事前に置換
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
                    const PROXY_PATH = "/api/proxy?url=";
                    const encodeUrl = (u) => btoa(unescape(encodeURIComponent(u))).replace(/\\//g, '_').replace(/\\+/g, '-');

                    // 1. 通信の心臓部（fetchとXHR）をジャックする
                    const originalFetch = window.fetch;
                    window.fetch = function(input, init) {
                        if (typeof input === 'string' && !input.includes(location.host) && input.startsWith('http')) {
                            input = PROXY_PATH + encodeUrl(new URL(input, "${origin}").href);
                        }
                        return originalFetch(input, init);
                    };

                    const originalOpen = XMLHttpRequest.prototype.open;
                    XMLHttpRequest.prototype.open = function(method, url) {
                        if (typeof url === 'string' && !url.includes(location.host) && url.startsWith('http')) {
                            url = PROXY_PATH + encodeUrl(new URL(url, "${origin}").href);
                        }
                        return originalOpen.apply(this, arguments);
                    };

                    // 2. オフライン記憶の抹殺
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(rs => { for(let r of rs) r.unregister(); });
                    }
                    Object.defineProperty(navigator, 'onLine', { get: () => true });

                    // 3. YouTubeの内部フラグを常にオンラインへ
                    setInterval(() => {
                        if (window.ytcfg) {
                            window.ytcfg.set('CONNECTED', true);
                            window.ytcfg.set('OFFLINE_MODE', false);
                        }
                        const err = document.querySelector('#error-screen, ytm-error-renderer');
                        if(err) err.remove();
                    }, 500);

                    // 4. 動的要素の書き換え
                    const fix = () => {
                        document.querySelectorAll('a, img').forEach(el => {
                            const attr = el.tagName === 'A' ? 'href' : 'src';
                            if (el[attr] && !el[attr].includes(location.host) && !el.dataset.px) {
                                el[attr] = PROXY_PATH + encodeUrl(new URL(el[attr], "${origin}").href);
                                el.dataset.px = '1';
                            }
                        });
                    };
                    setInterval(fix, 1000);
                })();
            </script>
            <style>
                #player-ads, .ad-slot, ytm-promoted-video-renderer { display: none !important; }
                #error-screen { display: none !important; }
            </style>`;

            return res.send(html.replace('<head>', '<head>' + inject));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("🚨 Error: " + e.message);
    }
}
