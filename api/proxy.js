export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("Kick Proxy: Ready");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        const contentType = response.headers.get('content-type') || 'text/html';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (contentType.includes('text/html')) {
            let html = await response.text();
            
            // リンクの書き換え（ここだけはプロキシの肝だから残す）
            html = html.replace(/(src|href)="([^"]+)"/ig, (match, attr, val) => {
                try {
                    const fullUrl = new URL(val, origin).href;
                    const enc = Buffer.from(fullUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?url=${enc}"`;
                } catch(e) { return match; }
            });

            return res.send(html);
        }

        const ab = await response.arrayBuffer();
        return res.send(Buffer.from(ab));

    } catch (e) {
        return res.status(500).send("Proxy Error: " + e.message);
    }
}
