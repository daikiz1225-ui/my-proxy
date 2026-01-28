const fetch = require('node-fetch');

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        // YouTubeの生存確認は即レスして「オフライン」を防ぐ
        if (decodedUrl.includes('generate_204')) return res.status(204).end();

        const response = await fetch(decodedUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': 'https://www.youtube.com/',
                'X-YouTube-Client-Name': '1',
                'X-YouTube-Client-Version': '2.20240126.00.00'
            },
            body: (req.method === 'POST') ? req.body : undefined
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType || 'text/html');

        // セキュリティヘッダーを解除してYouTubeのスクリプトを動かす
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
        
        const buffer = await response.buffer();
        res.send(buffer);
    } catch (e) {
        res.status(500).send("Proxy Error");
    }
}
