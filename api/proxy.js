export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.send("Proxy is ready. Enter URL.");
    }

    try {
        // ただサイトを取ってきて、そのまま出すだけ！
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', contentType);

        // HTMLの場合は、画像やリンクが切れないように最低限の修正だけする
        if (contentType.includes('html')) {
            let html = await response.text();
            const origin = new URL(url).origin;
            
            // "/css/style.css" みたいなのを "https://site.com/css/style.css" に直す
            html = html.replace(/(href|src)="\/([^"]+)"/g, `$1="${origin}/$2"`);
            
            return res.send(html);
        }

        // 画像などはそのまま出す
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        return res.send("Error: サイトを読み込めませんでした。");
    }
}
