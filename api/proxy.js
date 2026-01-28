const fetch = require('node-fetch');
const adblock = require('./adblock'); 
const rewriter = require('./rewriter');

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");
    
    const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();

    try {
        const response = await fetch(decodedUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)',
                'Referer': new URL(decodedUrl).origin,
                'Origin': new URL(decodedUrl).origin
            },
            body: (req.method !== 'GET' && req.method !== 'HEAD') ? JSON.stringify(req.body) : undefined
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();
            html = adblock.clean(html);
            html = rewriter.rewrite(html, decodedUrl);
            return res.send(html);
        }

        const buffer = await response.buffer();
        res.send(buffer);
    } catch (e) {
        res.status(500).send("Error");
    }
}
