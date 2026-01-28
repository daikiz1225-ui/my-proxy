export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("URLが必要です");
    
    try {
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // 文字データ（HTML/CSS/JS）なら、住所をプロキシ経由に書き換える
        if (contentType && (contentType.includes('text') || contentType.includes('javascript'))) {
            let text = await response.text();
            const origin = new URL(url).origin;
            
            // 相対パス（/assets/...など）をプロキシ経由に変換
            const replaced = text.replace(/(src|href)="\/(?!\/)/g, `$1="/proxy/${origin}/`);
            res.send(replaced);
        } else {
            // 画像などはそのまま流す
            const buffer = await response.arrayBuffer();
            res.send(Buffer.from(buffer));
        }
    } catch (e) {
        res.status(500).send("Error");
    }
}
