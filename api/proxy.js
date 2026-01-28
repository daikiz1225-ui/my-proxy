const fetch = require('node-fetch');

export default async function handler(req, res) {
    let { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        // POSTリクエスト（検索など）にも対応させる
        const response = await fetch(decodedUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': '*/*',
                'Origin': 'https://www.youtube.com',
                'Referer': 'https://www.youtube.com/',
                'Cookie': req.headers.cookie || ''
            },
            body: req.method === 'POST' ? req.body : undefined
        });

        // 相手のContent-Typeをそのまま引き継ぐ（重要：JSONならJSONで返す）
        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        const buffer = await response.buffer();
        res.send(buffer);
    } catch (e) {
        res.status(200).send(`Error: ${e.message}`);
    }
}
