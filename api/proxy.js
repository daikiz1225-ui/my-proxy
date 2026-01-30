export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("System Active.");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': 'https://www.bing.com/'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();
            const proxyBase = "/api/proxy?url=";

            // ページ内のすべてのURLをプロキシ経由に書き換える
            html = html.replace(/(src|href|srcset)="([^"]+)"/g, (match, attr, val) => {
                try {
                    if (val.startsWith('http') || val.startsWith('//') || val.startsWith('/')) {
                        const abs = new URL(val, origin).href;
                        const enc = Buffer.from(abs).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                        return `${attr}="${proxyBase}${enc}"`;
                    }
                } catch(e) {}
                return match;
            });
            return res.send(html);
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
    } catch (e) {
        return res.status(500).send("Proxy Error: " + e.message);
    }
}
