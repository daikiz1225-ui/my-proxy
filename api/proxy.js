export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL provided");

    let decodedUrl;
    try {
        // URLのデコード
        decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
    } catch (e) {
        return res.status(400).send("Invalid URL encoding");
    }

    try {
        // Vercel標準のfetchを使用（node-fetchは不要）
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

        // HTMLの場合：広告消しとリンク改造をこの中で一気にやる
        if (contentType.includes('text/html')) {
            let html = await response.text();
            const origin = new URL(decodedUrl).origin;

            // --- YouTubeオンライン偽装 ＆ リンクプロキシ化スクリプト ---
            const injectScript = `
            <script>
                (function() {
                    // 1. YouTubeオンライン偽装
                    const ytFix = () => {
                        if (window.ytcfg) {
                            window.ytcfg.set('CONNECTED', true);
                            window.ytcfg.set('OFFLINE_MODE', false);
                        }
                    };
                    setInterval(ytFix, 1000);

                    // 2. 全リンクをプロキシ経由に改造
                    const wrap = (u) => {
                        if(!u || typeof u !== 'string' || u.includes(location.host) || u.startsWith('data:')) return u;
                        try {
                            const abs = new URL(u, "${origin}").href;
                            return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                        } catch(e) { return u; }
                    };
                    setInterval(() => {
                        document.querySelectorAll('a').forEach(a => { if(a.href && !a.dataset.px) { a.href = wrap(a.href); a.dataset.px='1'; } });
                    }, 1000);

                    // 3. 矢印ボタン対応
                    window.addEventListener('message', e => {
                        if(e.data === 'back') history.back();
                        if(e.data === 'forward') history.forward();
                        if(e.data === 'reload') location.reload();
                    });
                })();
            </script>`;

            // 広告バナーを消すスタイル
            const adStyle = '<style>ins.adsbygoogle, .ad-slot, #player-ads { display: none !important; }</style>';

            // まとめて注入
            html = html.replace('<head>', '<head>' + adStyle + injectScript);
            // 相対パスを修正
            html = html.replace(/(src|href)="\/(?!\/)/g, \`$1="\${origin}/\`);

            return res.send(html);
        }

        // HTML以外（画像、JS、動画）
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        // エラー内容を画面に出す（デバッグ用）
        res.status(500).send("Proxy Error: " + e.message);
    }
}
