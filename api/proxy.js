export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("URLが必要です");
    
    const targetUrl = url.startsWith('http') ? url : 'https://' + url;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                // 本物のiPadのSafariになりすます
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ja-JP,ja;q=0.9'
            }
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'text/html');
        
        // セキュリティ制限を解除しつつ、i-FILTERに「ただの通信」と思わせる
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Frame-Options', 'ALLOWALL');

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (e) {
        res.status(500).send("Connection Error");
    }
}
