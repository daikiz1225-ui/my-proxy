const fetch = require('node-fetch');

export default async function handler(req, res) {
    let { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(decodedUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': '*/*',
                'Cookie': req.headers.cookie || '', // 足跡をYouTubeに渡す
                'Referer': new URL(decodedUrl).origin
            },
            body: req.method !== 'GET' ? req.body : undefined
        });

        // YouTubeからの返事（ヘッダー）をそのままiPadに返す
        res.setHeader('Content-Type', response.headers.get('content-type') || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        const buffer = await response.buffer();
        res.send(buffer);
    } catch (e) {
        res.status(200).send(`Error: ${e.message}`);
    }
}
