const fetch = require('node-fetch');

export default async function handler(req, res) {
    let { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        let decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        // GoogleのキャッシュやGoogle翻訳を隠れ蓑にする（i-FILTERを騙すテクニック）
        const proxyUrl = "https://translate.google.com/translate?sl=en&tl=ja&u=" + encodeURIComponent(decodedUrl);

        const response = await fetch(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept-Language': 'ja-JP,ja;q=0.9'
            }
        });

        let html = await response.text();

        // YouTubeのドメインを自分のドメインに書き換えて、iPadに「自分のサイトだ」と思わせる
        html = html.replace(/https:\/\/www.youtube.com/g, window.location.origin + '/proxy/');

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(html);
    } catch (e) {
        res.status(200).send(`Critical Bypass Error: ${e.message}`);
    }
}
