export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.send("<h1>YouTube Proxy : Ready</h1>");

        let decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();

        // 【新機能】もし動画視聴ページなら、強制的に「埋め込みプレイヤー」のURLに書き換える
        // これでライブ配信も「オフライン」判定を避けつつ再生できる
        if (decodedUrl.includes('watch?v=')) {
            const videoId = new URL(decodedUrl).searchParams.get('v');
            decodedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1`;
        } else if (!decodedUrl.includes('embed')) {
            // 動画視聴以外は、より軽量なモバイル版をターゲットにする
            decodedUrl = decodedUrl.replace('www.youtube.com', 'm.youtube.com');
        }

        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': 'https://www.youtube.com/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();

            // サーバー側でリンクと画像を書き換え
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

                    // 通信ジャック（ライブのストリーミングを止めないための処理）
                    const orgFetch = window.fetch;
                    window.fetch = function(u, i) {
                        if (typeof u === 'string' && u.startsWith('http') && !u.includes(location.host)) {
                            u = P_URL + enc(u);
                        }
                        return orgFetch(u, i);
                    };

                    // オフライン判定を力技で消す
                    Object.defineProperty(navigator, 'onLine', { get: () => true });
                    setInterval(() => {
                        if (window.ytcfg) {
                            window.ytcfg.set('CONNECTED', true);
                            window.ytcfg.set('OFFLINE_MODE', false);
                        }
                        // もしエラー画面が出たら即消去
                        const err = document.querySelector('#error-screen, .ytp-error');
                        if(err) err.style.display = 'none';
                    }, 500);

                    // リンクをタップした時に「watch」ページならプロキシ経由で再読み込み
                    document.addEventListener('click', e => {
                        const a = e.target.closest('a');
                        if (a && a.href && !a.href.includes(location.host)) {
                            e.preventDefault();
                            window.location.href = P_URL + enc(a.href);
                        }
                    }, true);
                })();
            </script>
            <style>
                /* 埋め込みモードを全画面にするための調整 */
                body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
                iframe { border: none; width: 100vw; height: 100vh; }
                .ad-slot, #masthead-ad { display: none !important; }
            </style>`;

            return res.send(html.replace('<head>', '<head>' + inject));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("🚨 Error: " + e.message);
    }
}
