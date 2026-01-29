export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.send("Proxy is Online");

        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();

            // --- [サーバー側での爆速書き換え処理] ---
            // 1. 画像URLを正規表現で一括置換（ブラウザに届く前にプロキシ化）
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

            // 2. ブラウザ側で動く補助スクリプト（動的読み込み用
        const inject = `
            <script>
                (function() {
                    // 1. ブラウザの基本機能を「常にオンライン」に固定
                    Object.defineProperty(navigator, 'onLine', { get: () => true });
                    window.addEventListener('offline', (e) => e.stopImmediatePropagation(), true);
                    window.addEventListener('online', (e) => e.stopImmediatePropagation(), true);

                    // 2. YouTube専用のフラグを強制上書き
                    const fakeOnline = () => {
                        if (window.ytcfg) {
                            // YouTubeの接続状態を「CONNECTED」に固定
                            window.ytcfg.set('CONNECTED', true);
                            window.ytcfg.set('OFFLINE_MODE', false);
                            // 内部データ層も念のため書き換え
                            if (window.ytcfg.data_) {
                                window.ytcfg.data_.CONNECTED = true;
                                window.ytcfg.data_.OFFLINE_MODE = false;
                            }
                        }
                        // ページ全体の「オフライン」クラスを強制削除
                        document.documentElement.classList.remove('yt-mode-offline');
                        document.body.classList.remove('offline');
                    };

                    // 0.1秒ごとに監視して、YouTubeがオフラインに切り替えようとした瞬間に書き戻す
                    setInterval(fakeOnline, 100);

                    // 3. プロキシURL変換（既存の機能も維持）
                    const px = (u) => {
                        if(!u || typeof u !== 'string' || u.includes(location.host) || u.startsWith('data:')) return u;
                        const abs = new URL(u, "${origin}").href;
                        return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
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
                    setInterval(fix, 1000);
                })();
            </script>`;
