import { rewriteHTML } from './rewriter.js';

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("Proxy Ready");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const response = await fetch(decodedUrl);
        const contentType = response.headers.get('content-type') || '';

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();
            // 職人にHTMLを渡して加工してもらう
            return res.send(rewriteHTML(html, new URL(decodedUrl).origin));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
    } catch (e) {
        return res.status(500).send("Proxy Error: " + e.message);
    }
}
