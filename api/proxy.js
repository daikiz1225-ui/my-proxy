export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("URLが必要です");
    
    const targetUrl = url.startsWith('http') ? url : 'https://' + url;
    const origin = new URL(targetUrl).origin;

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (contentType && (contentType.includes('text') || contentType.includes('javascript'))) {
            let text = await response.text();
            
            // 住所書き換え：相対パスをすべて自分のVercel経由に強制変換
            const replaced = text
                .replace(/(src|href|action)="\/(?!\/)/g, `$1="/proxy/${origin}/`)
                .replace(/url\(['"]?\/(?!\/)/g, `url("/proxy/${origin}/`) // CSSの中の画像も救出
                .replace(/https?:\/\/(?!my-proxy-bice\.vercel\.app)/g, (match) => `/proxy/${match}`);

            res.send(replaced);
        } else {
            const buffer = await response.arrayBuffer();
            res.send(Buffer.from(buffer));
        }
    } catch (e) {
        res.status(500).send("Error: " + e.message);
    }
}
