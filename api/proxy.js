const fetch = require('node-fetch');

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const urlObj = new URL(decodedUrl);

        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (contentType && contentType.includes('text/html')) {
            let body = await response.text();
            
            // 1. Pokiの404を防ぐためのベースURLタグを注入
            body = body.replace('<head>', `<head><base href="${urlObj.origin}${urlObj.pathname}">`);

            // 2. 広告とレイアウト崩れの原因になるスクリプトを無効化
            body = body.replace(/google-analytics\.com|googletagservices\.com|googlesyndication\.com/g, 'example.com');
            
            // 3. Game8の右側が黒くなるのを防ぐCSS注入
            const customCSS = `
            <style>
                #right-column, .side-content, .ad-slot, iframe[id*="google_ads"] { display: none !important; }
                #main-column, .main-content { width: 100% !important; margin: 0 !important; }
                body { overflow-x: hidden !important; width: 100vw !important; }
            </style>`;
            body = body.replace('</head>', customCSS + '</head>');

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(body);
        }

        const buffer = await response.buffer();
        res.setHeader('Content-Type', contentType);
        res.send(buffer);
    } catch (e) {
        res.status(500).send("Proxy Error: " + e.message);
    }
}
