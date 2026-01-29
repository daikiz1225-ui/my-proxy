import { rewriteHTML } from './rewriter.js';

export default async function handler(req, res) {
    try {
        const { url } = req.query;
        if (!url) return res.send("Proxy Ready");

        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const response = await fetch(decodedUrl);
        const contentType = response.headers.get('content-type') || '';

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();
            return res.send(rewriteHTML(html, new URL(decodedUrl).origin));
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
    } catch (e) {
        // 【500対策】エラーメッセージをそのまま画面に出す！
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.status(500).send("🚨 500エラー発生！原因はこれだ:\\n" + e.stack);
    }
}
