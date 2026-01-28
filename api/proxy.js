const fetch = require('node-fetch');

export default async function handler(req, res) {
    let { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        // YouTubeの「接続確認」用のURL（generate_204）を狙い撃ち
        if (decodedUrl.includes('generate_204')) {
            res.status(204).end();
            return;
        }

        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept-Language': 'ja-JP,ja;q=0.9',
                'Referer': 'https://www.youtube.com/'
            }
        });

        res.setHeader('Content-Type', response.headers.get('content-type') || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // ★重要：YouTubeのセキュリティヘッダーを全て削除して、iPadが自由に動けるようにする
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');

        const buffer = await response.buffer();
        res.send(buffer);
    } catch (e) {
        res.status(200).send(`Offline Bypass Active: ${e.message}`);
    }
}
