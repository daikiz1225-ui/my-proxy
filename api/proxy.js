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

            // 1. サーバー側での先行URL置換
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

            // 2. ブラウザ側：画面を消さずにオフラインを殺すスクリプト
            const inject = `
            <script>
                (function() {
                    // Service Workerを消去（リロードなしで実行）
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(rs => {
                            for(let r of rs) r.unregister();
                        });
                    }

                    // 強制オンライン偽装
                    Object.defineProperty(navigator, 'onLine', { get: () => true });

                    const recover = () => {
                        if (window.ytcfg) {
                            window.ytcfg.set('CONNECTED', true);
                            window.ytcfg.set('OFFLINE_MODE', false);
                        }
                        
                        // 【ここがポイント】オフライン画面が出ていたら、その要素だけを物理的に消し飛ばす
                        const errorScreen = document.querySelector('#error-screen, ytm-error-renderer, .yt-mode-offline');
                        if (errorScreen) {
                            errorScreen.remove(); // 画面を消さずに、エラーだけ消す
                            console.log('Offline screen removed');
                        }
                    };

                    // 0.5秒ごとにエラー画面が出ていないか見張る
                    setInterval(recover, 500);

                    // リンク変換
                    const px = (u) => {
                        if(!u || typeof u !== 'string' || u.includes(location.host) || u.startsWith('data:')) return u;
                        try {
                            const abs = new URL(u, "${origin}").href;
                            return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                        } catch(e) { return u; }
                    };

                    const fix = () => {
                        document.querySelectorAll('a, img, form').forEach(el => {
                            if(el.tagName==='A' && el.href && !el.dataset.px) { el.href = px(el.href); el.dataset.px='1'; }
                            if(el.tagName==='IMG' && el.src && !el.dataset.px) { el.src = px(el.src); el.dataset.px='1'; }
                            if(el.tagName==='FORM' && !el.dataset.px) {
                                el.addEventListener('submit', e => {
                                    e.preventDefault();
                                    const fd = new URLSearchParams(new FormData(el)).toString();
                                    window.location.href = px(el.action + (el.action.includes('?')?'&':'?') + fd);
                                });
                                el.dataset.px='1';
                            }
                        });
                    };
                    setInterval(fix, 1000);
                })();
            </script>
            <style>
                #player-ads, .ad-slot, #masthead-ad { display: none !important; }
                /* オフライン表示自体をCSSで最初から無効化する */
                ytm-error-renderer, #error-screen { visibility: hidden !important; pointer-events: none !important; }
            </style>`;

            return res.send(html.replace('<head>', '<head>' + inject));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("Error: " + e.message);
    }
}
