const fetch = require('node-fetch');

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
            }
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType || 'text/html');
        
        const buffer = await response.buffer();
        res.send(buffer);
    } catch (e) {
        res.status(500).send("Fetch Error");
    }
}
