const fetch = require('node-fetch');
// 6個目の専門家をインポート（後で作るファイル）
const { rewrite } = require('./rewriter');

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
            // 6個目の専門家「リンク書き換え職人」に仕事を依頼！
            html = rewrite(html, decodedUrl);
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
