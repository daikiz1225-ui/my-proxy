const fetch = require('node-fetch');

export default async function handler(req, res) {
    let { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept-Language': 'ja-JP,ja;q=0.9',
                'Referer': 'https://www.google.com/'
            }
        });

        let contentType = response.headers.get('content-type');
        let buffer = await response.buffer();

        // もしHTMLだったら、中身のURLをすべて「自分のサーバー経由」に書き換える
        if (contentType && contentType.includes('text/html')) {
            let html = buffer.toString();
            // YouTubeのリンクを全てプロキシ経由に置換
            html = html.replace(/https:\/\/(www|m)\.youtube\.com/g, `https://${req.headers.host}`);
            // スクリプトの注入
            html = html.replace('<head>', '<head><script src="/inject.js"></script><script src="/lang.js"></script>');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(html);
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(buffer);
    } catch (e) {
        res.status(200).send(`<script>alert("通信エラー: ${e.message}");</script>`);
    }
}
