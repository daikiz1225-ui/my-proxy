export default async function handler(req, res) {
    const { id } = req.query;
    
    // ホーム画面（何も入力がない時）の表示
    if (!id) return res.send("<h1>System: Ready</h1><p>Proxy is active with Ad-Block.</p>");

    // 🚫 広告ブロックルールを直接プログラムに書き込む
    const adRules = {
        domains: [
            "googlesyndication.com", "doubleclick.net", "amazon-adsystem.com", 
            "adnxs.com", "google-analytics.com", "geniee.jp", "microad.jp", "ad-delivery.net"
        ],
        selectors: [
            ".adsbygoogle", "[id^='ad-']", "iframe[src*='ads']", ".ad-box", "#ad-container"
        ]
    };

    try {
        // Base64デコード（URLを復元）
        const target = Buffer.from(id.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(target, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);
        res.setHeader('Content-Disposition', 'inline');

        if (ct.includes('html')) {
            let html = await response.text();
            const origin = new URL(target).origin;

            // 1. サーバー側で広告スクリプトを抹殺
            adRules.domains.forEach(d => {
                const regex = new RegExp('<script.*?src=".*?'+d+'.*?"><\\/script>', 'gi');
                html = html.replace(regex, '');
            });

            // 2. リンクと画像の書き換え（ここが肝心！）
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    // 相対パスを絶対パスに
                    const abs = new URL(val, origin).href;
                    
                    // 画像などは直接読み込み（高速化）、それ以外はプロキシ経由
                    if (attr === 'src' && /\.(jpg|png|gif|webp|svg|css|js)/.test(abs)) return `${attr}="${abs}"`;
                    
                    // 次のページ移動もこのプロキシ(id=...)を通すようにエンコード
                    const enc = btoa(unescape(encodeURIComponent(abs))).replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?id=${enc}"`;
                } catch { return m; }
            });

            // 3. ブラウザ側での広告非表示スタイルと、広告ブロック検知の回避
            const stealth = `
            <style>
                ${adRules.selectors.join(',')}{display:none!important;}
            </style>
            <script>
                // 広告があるフリをして、サイトの「広告を許可してください」エラーを防ぐ
                window.adsbygoogle = window.adsbygoogle || [];
                window.adsbygoogle.push = function(){};
                window.ga = function(){};
                console.log("AdBlock Shield Active");
            </script>`;

            return res.send(stealth + html);
        }

        // HTML以外（画像データなど）はそのまま返す
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        // エラーが出ても「ページなし」に見せかける
        return res.status(404).send("Not Found");
    }
}
