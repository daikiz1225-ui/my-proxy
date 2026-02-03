export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.send("<h1>Kick Search</h1><p>System Ready.</p>");

    try {
        const target = Buffer.from(id.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(target, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ja,en;q=0.9'
            }
        });

        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        if (ct.includes('html')) {
            let html = await response.text();
            const origin = new URL(target).origin;

            // リンクの書き換え（次のページもKick Searchを通すため）
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    const abs = new URL(val, origin).href;
                    if (attr === 'src' && /\.(js|css|png|jpg|gif|svg)/.test(abs)) return `${attr}="${abs}"`;
                    const enc = btoa(unescape(encodeURIComponent(abs))).replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?id=${enc}"`;
                } catch { return m; }
            });

            // --- 🛡️ アンチ・アドブロック回避スクリプト ---
            // サイト側に「広告はちゃんと読み込まれてますよ」と思わせるダミー
            const bypassScript = `
            <script>
                // 広告ユニットが存在するフリをする
                window.adsbygoogle = window.adsbygoogle || [];
                window.adsbygoogle.loaded = true;
                window.ga = window.ga || function() {};
                window.google_ad_client = "ca-pub-dummy";
                
                // 広告ブロック検知関数を無効化する
                window.checkAdBlock = function() { return false; };
                window.isAdBlockActive = false;
                
                console.log("Kick Search: Mimic Mode Active");
            </script>`;

            return res.send(bypassScript + html);
        }

        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        return res.status(500).send("Kick Search Error: " + e.message);
    }
}
