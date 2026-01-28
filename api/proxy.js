const fetch = require('node-fetch');

export default async function handler(req, res) {
    let { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        // Base64デコード
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': '*/*'
            },
            timeout: 10000 // 10秒でタイムアウト
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const buffer = await response.buffer();
        res.send(buffer);
    } catch (e) {
        console.error(e);
        res.status(200).send(`
            <div style="color:red; padding:20px; font-family:sans-serif;">
                <h3>通信エラー発生</h3>
                <p>理由: ${e.message}</p>
                <button onclick="location.reload()">再試行</button>
            </div>
        `);
    }
}
