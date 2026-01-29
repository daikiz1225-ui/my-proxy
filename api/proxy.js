export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.send("Proxy is Online");

        // URLデコード
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        // ターゲット取得
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

            // 1. 【サーバー側】画像URLの先行書き換え（爆速化）
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

            // 2. 【ブラウザ側】オフライン回避 ＆ 動的リンク変換
            const inject = `
            <script>
                (function() {
                    // --- オフライン絶対出さない設定 ---
                    Object.defineProperty(navigator, 'onLine', { get: () => true });
                    const fakeOnline = () => {
                        if (window.ytcfg) {
                            window.ytcfg.set('CONNECTED', true);
                            window.ytcfg.set('OFFLINE_MODE', false);
                            if (window.ytcfg.data_) {
                                window.ytcfg.data_.CONNECTED = true;
                                window.ytcfg.data_.OFFLINE_MODE = false;
                            }
                        }
                        document.documentElement.classList.remove('yt-mode-offline');
                        document.body.classList.remove('offline');
                    };
                    setInterval(fakeOnline, 100);

                    // --- プロキシURL変換機能 ---
                    const px = (u) => {
                        if(!u || typeof u !== 'string' || u.includes(location.host) || u.startsWith('data:')) return u;
                        try {
                            const abs = new URL(u, "${origin}").href;
                            return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                        } catch(e) { return u; }
                    };

                    // リンク・画像・フォームの自動書き換え
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
                .ytp-error-screen { background: none !important; } /* エラー画面を隠す */
            </style>`;

            return res.send(html.replace('<head>', '<head>' + inject));
        }

        // HTML以外（画像、スクリプト等）はそのまま返す
        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("🚨 Error: " + e.message);
    }
}
