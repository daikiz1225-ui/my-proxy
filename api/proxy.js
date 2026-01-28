const fetch = require('node-fetch');
const adblock = require('./adblock'); 
const rewriter = require('./rewriter');

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");
    
    let decodedUrl;
    try {
        decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
    } catch (e) {
        return res.status(400).send("Decode Error");
    }

    try {
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': new URL(decodedUrl).origin
            }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            const html = await response.text();
            // adblockとrewriterを順番に通す
            let processed = adblock.clean(html);
            processed = rewriter.rewrite(processed, decodedUrl);
            return res.send(processed);
        }

        const buffer = await response.buffer();
        res.send(buffer);
    } catch (e) {
        res.status(500).send("Proxy Error");
    }
}
