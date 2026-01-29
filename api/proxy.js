export default async function handler(req, res) {
    const { url, q } = req.query; // q は検索ワード用

    // --- A. URLも検索ワードもない場合：ホーム画面を表示 ---
    if (!url && !q) {
        return res.send(`
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Daiki Proxy Search</title>
                <style>
                    body { background: #121212; color: white; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .search-box { width: 90%; max-width: 600px; text-align: center; }
                    input { width: 100%; padding: 15px; border-radius: 30px; border: none; font-size: 18px; outline: none; margin-bottom: 20px; background: #333; color: white; }
                    button { padding: 10px 25px; border-radius: 20px; border: none; background: #ff0000; color: white; font-weight: bold; cursor: pointer; transition: 0.3s; }
                    button:hover { background: #cc0000; transform: scale(1.05); }
                    .logo { font-size: 40px; font-weight: bold; margin-bottom: 30px; letter-spacing: -1px; }
                    .logo span { color: #ff0000; }
                </style>
            </head>
            <body>
                <div class="search-box">
                    <div class="logo">Daiki<span>Proxy</span></div>
                    <form action="/api/proxy" method="GET">
                        <input type="text" name="q" placeholder="検索ワードを入力..." required>
                        <br>
                        <button type="submit">検索してプロキシで開く</button>
                    </form>
                </div>
            </body>
            </html>
        `);
    }

    // --- B. 検索ワード(q)がある場合：DuckDuckGoの検索結果をプロキシで取得して表示 ---
    if (q) {
        // DuckDuckGoのHTML版を検索して、結果をリスト表示する
        const searchUrl = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q);
        const encodedSearch = Buffer.from(searchUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
        // 自分自身をプロキシとしてリダイレクト
        return res.redirect(\`/api/proxy?url=\${encodedSearch}\`);
    }

    // --- C. 実際のプロキシ処理（ここから下は前のコードとほぼ同じ） ---
    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();
            const proxyBase = "/api/proxy?url=";

            // リンクをすべてプロキシ経由に書き換え（検索結果も自動でこれに引っかかる）
            html = html.replace(/(src|href|srcset)="([^"]+)"/g, (match, attr, val) => {
                if (val.startsWith('http') || val.startsWith('//') || val.startsWith('/')) {
                    try {
                        const abs = new URL(val, origin).href;
                        const enc = Buffer.from(abs).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                        return \`\${attr}="\${proxyBase}\${enc}"\`;
                    } catch(e) { return match; }
                }
                return match;
            });

            return res.send(html);
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("🚨 Error: " + e.message);
    }
}
