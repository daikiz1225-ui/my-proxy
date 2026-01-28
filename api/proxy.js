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
        return res.status(400).send("Invalid URL");
    }

    try {
        // 1. リクエストの準備（iPadからの指示をすべて再現）
        const options = {
            method: req.method, // GETだけでなくPOSTなども通す
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': new URL(decodedUrl).origin,
                'Accept': '*/*',
            }
        };

        // POSTリクエストなどのボディ（データ）があれば中継する
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            options.body = req.body;
        }

        const response = await fetch(decodedUrl, options);

        // 2. レスポンスヘッダーのコピー
        const contentType = response.headers.get('content-type');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType || 'text/plain');

        // 3. HTMLなら「広告消し」と「リンク改造」を適用
        if (contentType && contentType.includes('text/html')) {
            let html = await response.text();
            html = adblock.clean(html);
            html = rewriter.rewrite(html, decodedUrl);
            return res.send(html);
        }

        // 4. それ以外（JS, 画像, ゲームデータ等）はそのまま流す
        const buffer = await response.buffer();
        res.send(buffer);

    } catch (e) {
        console.error(e);
        res.status(500).send("Proxy Error: " + e.message);
    }
}
