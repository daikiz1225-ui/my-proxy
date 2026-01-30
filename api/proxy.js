export default async function handler(req, res) {
    const { url: q } = req.query;
    const target = q ? Buffer.from(q.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString() 
                     : "https://html.duckduckgo.com/html/";

    try {
        const r = await fetch(target, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const ct = r.headers.get('content-type') || '';
        
        // 画像は引き続き高速モード（直接読み込み）
        if (ct.includes('image') || ct.includes('css') || ct.includes('javascript')) {
            res.setHeader('Content-Type', ct);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            const ab = await r.arrayBuffer();
            return res.send(Buffer.from(ab));
        }

        // --- HTMLの場合の処理 ---
        let h = await r.text();
        const o = new URL(target).origin;

        // 1. リンクと画像の書き換え
        h = h.replace(/(src|href)="([^"]+)"/ig, (m, attr, val) => {
            try {
                const fullUrl = new URL(val, o).href;
                // 画像は直接、リンクはプロキシ
                if (attr === 'src' && /\.(jpg|jpeg|png|gif|webp)/i.test(fullUrl)) return `${attr}="${fullUrl}"`;
                const enc = Buffer.from(fullUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                return `${attr}="/api/proxy?url=${enc}"`;
            } catch { return m; }
        });

        // 2. ★最強の「ダウンロード回避」スクリプト
        const bypassScript = `
        <script>
        (function() {
            // リンククリック時の挙動を完全に上書き
            document.addEventListener('click', e => {
                const a = e.target.closest('a');
                if (a && a.href && !a.href.includes(location.host)) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    
                    let targetUrl = a.href;
                    // DDGのuddgパラメータがあれば抜く
                    if (targetUrl.includes('uddg=')) {
                        targetUrl = new URL(targetUrl).searchParams.get('uddg');
                    }
                    
                    const enc = btoa(unescape(encodeURIComponent(targetUrl))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    
                    // 【ここが重要】一度空のページにしてから遷移することでブラウザの「ダウンロード判定」をリセットする
                    document.body.innerHTML = '<div style="color:white;text-align:center;margin-top:20%;font-family:sans-serif;">Loading...</div>';
                    window.location.replace("/api/proxy?url=" + enc);
                }
            }, true);
        })();
        </script>`;

        // ブラウザに「これは絶対Webページだぞ！」と念押しするヘッダー群
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        return res.send(bypassScript + h);

    } catch (e) {
        return res.send("<html><body>Error. <a href='/api/proxy'>Retry</a></body></html>");
    }
}
