export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.send("<h1>Kick Search V4</h1><p>Status: Killer Mode Ready</p>");

    try {
        const target = Buffer.from(id.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const targetUrlObj = new URL(target);

        // 1. 身分証（ヘッダー）の徹底的な偽装
        // 「私はiPadで、このサイトの中からクリックして移動してきました」と主張する
        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Referer': targetUrlObj.origin + '/', // ここが重要！「Vercel」ではなく「サイトのトップ」から来たことにする
            'Origin': targetUrlObj.origin,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Cache-Control': 'no-cache'
        };

        const response = await fetch(target, { headers });

        // 2. クッキー（通行手形）の受け渡し
        // これがないと「セッション切れ」とみなされてエラーになることがある
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) res.setHeader('Set-Cookie', setCookie);

        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        if (ct.includes('html')) {
            let html = await response.text();
            const origin = targetUrlObj.origin;

            // 3. 🚫 検知スクリプト・広告の「抹殺」リスト
            // だいきの「ブロックしたら治った」を再現するため、日本の主要な広告・解析タグを消す
            const killerList = [
                'googlesyndication', 'doubleclick', 'amazon-adsystem', // 海外大手
                'geniee', 'microad', 'fluct', 'adingo', 'popin', // 日本のGame8とかによくあるやつ
                'adsbygoogle', 'google-analytics', 'googletagmanager' // 解析・検知系
            ];

            // 該当するスクリプトタグをHTMLから完全に削除
            killerList.forEach(keyword => {
                const regex = new RegExp(`<script[^>]*?${keyword}[^>]*?>[\\s\\S]*?<\\/script>`, 'gi');
                html = html.replace(regex, '');
                // script src="..." のパターンも削除
                const srcRegex = new RegExp(`src="[^"]*?${keyword}[^"]*?"`, 'gi');
                html = html.replace(srcRegex, 'data-blocked="true"');
            });

            // 4. リンク修正 (ここもしっかりやる)
            html = html.replace(/(href|src|action)="([^"]+)"/g, (m, attr, val) => {
                try {
                    // javascript: などの特殊なリンクは無視
                    if (val.startsWith('#') || val.startsWith('javascript') || val.startsWith('mailto')) return m;

                    const abs = new URL(val, origin).href;
                    
                    // 画像・CSS・JSファイルは直接読み込んでスピードアップ＆エラー回避
                    if (attr === 'src' && /\.(jpg|png|gif|webp|svg|css|js|woff|ttf)/i.test(abs)) {
                        return `${attr}="${abs}"`;
                    }

                    // それ以外のリンク（ページ移動）はプロキシを通す
                    const enc = btoa(unescape(encodeURIComponent(abs))).replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?id=${enc}"`;
                } catch { return m; }
            });

            // 5. 最後の仕上げ：ブラウザ側でも広告枠を強制非表示にするスタイル注入
            const styleShield = `
            <style>
                [id*="ad-"], [class*="ad-"], [class*="ads"], 
                iframe[src*="google"], iframe[src*="amazon"],
                .adsbygoogle, .g-ads { display: none !important; }
            </style>`;
            
            return res.send(styleShield + html);
        }

        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        return res.status(500).send("Proxy Error: " + e.message);
    }
}
