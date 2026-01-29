import { rewriteHTML } from './rewriter.js';
import { blockAds } from './adblock.js';

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(200).send("Proxy is Ready!");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': 'https://www.youtube.com/',
                'Origin': 'https://www.youtube.com/'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();
            html = blockAds(html);
            html = rewriteHTML(html, decodedUrl);
            return res.send(html);
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
    } catch (e) {
        return res.status(500).send("Proxy Error: " + e.message);
    }
}
