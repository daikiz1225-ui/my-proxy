export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("System Active.");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const contentType = response.headers.get('content-type') || '';
        
        // ★最重要：HTMLなら、とにかく「これはWebページだぞ！」とブラウザに叩き込む
        if (contentType.includes('html')) {
            let html = await response.text();
            const origin = new URL(decodedUrl).origin;

            // リンクの書き換え（シンプルかつ確実な方法に戻す）
            html = html.replace(/(src|href)="([^"]+)"/ig, (m, attr, val) => {
                try {
                    const fullUrl = new URL(val, origin).href;
                    const enc = Buffer.from(fullUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?url=${enc}"`;
                } catch { return m; }
            });

            // iPadが「ファイルだ」と勘違いしないように、正しいHTMLの型を宣言する
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.setHeader('Content-Disposition', 'inline'); // 「保存」じゃなく「表示」しろという命令
            res.setHeader('X-Content-Type-Options', 'nosniff'); // 「勝手にファイル判定するな」という命令

            // 念のため、真っさらなHTMLの中に本物を流し込む
            const finalHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    ${html}
</body>
</html>`;

            return res.send(finalHtml);
        }

        // 画像などはそのまま
        res.setHeader('Content-Type', contentType);
        const ab = await response.arrayBuffer();
        return res.send(Buffer.from(ab));

    } catch (e) {
        return res.status(500).send("Proxy Error");
    }
}
