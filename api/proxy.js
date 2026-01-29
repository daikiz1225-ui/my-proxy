export default async function handler(req, res) {
    try {
        const { url } = req.query;
        // URLがない時は、入力用の簡易ページを出す
        if (!url) {
            return res.send('<html><body style="background:#000;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:sans-serif;">' +
                '<h2>YouTube Proxy Ready</h2>' +
                '<input id="u" type="text" placeholder="https://m.youtube.com" style="width:80%;padding:10px;border-radius:5px;">' +
                '<button onclick="location.href=\'/api/proxy?url=\'+btoa(document.getElementById(\'u\').value).replace(/\\//g,\'_\').replace(/\\+/g,\'-\')" style="margin-top:10px;padding:10px 20px;">Go</button>' +
                '</body></html>');
        }

        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            method: req.method,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': 'https://www.youtube.com/',
                'Origin': 'https://www.youtube.com/'
            },
            body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();
            const proxyBase = "/api/proxy?url=";

            // 1. サーバー側でのURL一括置換（画像・リンク・スクリプト）
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

            // 2. YouTubeの内部機能をジャックしてオフラインを封じる
            const inject = `
            <script>
                (function() {
                    // --- YouTubeの脳内（設定）を書き換える ---
                    const fakeYtcfg = () => {
                        if (window.ytcfg) {
                            if (window.ytcfg.set) {
                                window.ytcfg.set('CONNECTED', true);
                                window.ytcfg.set('OFFLINE_MODE', false);
                            }
                            if (window.ytcfg.data_) {
                                window.ytcfg.data_.CONNECTED = true;
                                window.ytcfg.data_.OFFLINE_MODE = false;
                            }
                        }
                    };
                    // 読み込み直後と、定期的に実行
                    fakeYtcfg();
                    setInterval(fakeYtcfg, 50);

                    // --- 通信の心臓部をプロキシに強制する ---
                    const P_URL = "/api/proxy?url=";
                    const enc = (u) => btoa(unescape(encodeURIComponent(new URL(u, "${origin}").href))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    
                    const orgFetch = window.fetch;
                    window.fetch = function(u, i) {
                        if (typeof u === 'string' && u.startsWith('http') && !u.includes(location.host)) u = P_URL + enc(u);
                        return orgFetch(u, i);
                    };

                    const orgOpen = XMLHttpRequest.prototype.open;
                    XMLHttpRequest.prototype.open = function(m, u) {
                        if (typeof u === 'string' && u.startsWith('http') && !u.includes(location.host)) u = P_URL + enc(u);
                        return orgOpen.apply(this, arguments);
                    };

                    // --- オフライン画面を物理的に抹殺 ---
                    Object.defineProperty(navigator, 'onLine', { get: () => true });
                    const style = document.createElement('style');
                    style.innerHTML = '#error-screen, ytm-error-renderer, .ytp-error { display: none !important; visibility: hidden !important; }';
                    document.head.appendChild(style);
                })();
            </script>`;

            return res.send(html.replace('<head>', '<head>' + inject));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("🚨 Error: " + e.message);
    }
}
