const fetch = require('node-fetch');

export default async function handler(req, res) {
    let { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        let decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        // 強制的にモバイル版YouTubeに飛ばす
        if (decodedUrl.includes('www.youtube.com')) {
            decodedUrl = decodedUrl.replace('www.youtube.com', 'm.youtube.com');
        }

        const response = await fetch(decodedUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': '*/*',
                'Accept-Language': 'ja-JP,ja;q=0.9',
                'Cookie': 'PREF=hl=ja&gl=JP;', // 日本語・日本地域を強制
                'Referer': 'https://m.youtube.com/'
            },
            body: (req.method === 'POST') ? req.body : undefined
        });

        res.setHeader('Content-Type', response.headers.get('content-type') || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");

        const buffer = await response.buffer();
        res.send(buffer);
    } catch (e) {
        res.status(200).send(`Bypass Error: ${e.message}`);
    }
}
