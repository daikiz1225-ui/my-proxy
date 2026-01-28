const fetch = require('node-fetch');
const adblock = require('./adblock'); // 8番目の専門家
const rewriter = require('./rewriter'); // 6番目の専門家

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");
    const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();

    try {
        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }
        });
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/html')) {
            let html = await response.text();
            
            // 順番が大事！
            html = adblock.clean(html);       // まず広告を消す
            html = rewriter.rewrite(html, decodedUrl); // その後リンクを改造する
            
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(html);
        }

        const buffer = await response.buffer();
        res.setHeader('Content-Type', contentType);
        res.send(buffer);
    } catch (e) {
        res.status(500).send("Fetch Error");
    }
}
