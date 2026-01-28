const fetch = require('node-fetch');
const adblock = require('./adblock');
const rewriter = require('./rewriter');

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");
    const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();

    try {
        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }
        });
        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            const html = await response.text();
            // 専門家たちに仕事を頼む
            let result = adblock.clean(html);
            result = rewriter.rewrite(result, decodedUrl);
            return res.send(result);
        }
        res.send(await response.buffer());
    } catch (e) {
        res.status(500).send("Error: " + e.message);
    }
}
