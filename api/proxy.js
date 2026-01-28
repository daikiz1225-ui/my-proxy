export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("URLが必要です");
    
    const targetUrl = url.startsWith('http') ? url : 'https://' + url;
    const origin = new URL(targetUrl).origin;

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' }
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (contentType && contentType.includes('text')) {
            let text = await response.text();
            
            // ★魔法の書き換えロジック★
            // ページ内の /css/ や /img/ を、すべて自分のプロキシ経由(/proxy/https://...)に書き換える
            const replaced = text
                .replace(/(src|href)="\/(?!\/)/g, `$1="/proxy/${origin}/`)
                .replace(/(src|href)="https?:\/\//g, (match) => `/proxy/${match.split('"')[1]}`);

            res.send(replaced);
        } else {
            const buffer = await response.arrayBuffer();
            res.send(Buffer.from(buffer));
        }
    } catch (e) {
        res.status(500).send("Error: " + e.message);
    }
}
