export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.send("Proxy is Online");

        // URLデコード
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        // ターゲット取得
        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();
            
            // 【ここに全機能を凝縮】YouTube偽装 + 画像速攻表示 + 検索ブロック回避
            const inject = `
            <script>
                (function() {
                    // 1. YouTubeを騙す
                    Object.defineProperty(navigator, 'onLine', { get: () => true });
                    setInterval(() => { if(window.ytcfg) window.ytcfg.set('CONNECTED', true); }, 500);

                    // 2. プロキシURL変換関数
                    const px = (u) => {
                        if(!u || typeof u !== 'string' || u.includes(location.host) || u.startsWith('data:')) return u;
                        const abs = new URL(u, "${origin}").href;
                        return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    };

                    // 3. 画像とリンクとフォームを全自動書き換え（爆速化）
                    const fix = () => {
                        document.querySelectorAll('img, a, form').forEach(el => {
                            if (el.tagName === 'A' && el.href && !el.dataset.px) { el.href = px(el.href); el.dataset.px = '1'; }
                            if (el.tagName === 'IMG' && el.src && !el.dataset.px) { el.src = px(el.src); el.dataset.px = '1'; }
                            if (el.tagName === 'FORM' && !el.dataset.px) {
                                el.addEventListener('submit', (e) => {
                                    e.preventDefault();
                                    const fd = new URLSearchParams(new FormData(el)).toString();
                                    window.location.href = px(el.action + (el.action.includes('?') ? '&' : '?') + fd);
                                });
                                el.dataset.px = '1';
                            }
                        });
                    };
                    setInterval(fix, 1000); fix();
                })();
            </script>
            <style>#player-ads, .ad-slot, #masthead-ad { display: none !important; }</style>`;

            return res.send(html.replace('<head>', '<head>' + inject));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("🚨 Error: " + e.message);
    }
}
