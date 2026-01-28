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
        return res.status(400).send("URL Decode Error");
    }

    try {
        const response = await fetch(decodedUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': 'https://www.youtube.com/',
                'Origin': 'https://www.youtube.com/'
            },
            // ボディがある場合はそのまま渡す（クラッシュ対策）
            body: (req.method !== 'GET' && req.method !== 'HEAD') ? req.body : undefined
        });

        // ヘッダーの設定
        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        // HTMLの場合だけ中身を書き換える
        if (contentType.includes('text/html')) {
            let html = await response.text();
            html = adblock.clean(html);
            html = rewriter.rewrite(html, decodedUrl);
            return res.send(html);
        }

        // ★重要：動画データや重いJSは、バッファに入れずにそのままパイプ（転送）する
        // これで 500 ERROR (Function Crash) を防ぐ
        response.body.pipe(res);

    } catch (e) {
        console.error("Crash Log:", e);
        res.status(500).send("Proxy Server is tired. Please try again.");
    }
}
