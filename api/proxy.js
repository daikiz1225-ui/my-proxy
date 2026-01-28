const fetch = require('node-fetch');

export default async function handler(req, res) {
    let { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept-Language': 'ja-JP,ja;q=0.9',
            }
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // セキュリティ制限を解除しつつ、フリーズを防ぐ
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        
        const buffer = await response.buffer();
        res.send(buffer);
    } catch (e) {
        res.status(500).send(`Error: ${e.message}`);
    }
}
