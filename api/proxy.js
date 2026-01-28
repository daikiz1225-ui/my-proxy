export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("URLが必要です");
    const targetUrl = url.startsWith('http') ? url : 'https://' + url;

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        // ヘッダーを偽装してi-FILTERを混乱させる
        res.setHeader('Content-Type', response.headers.get('content-type') || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // データを一気に送らず、バラバラの破片として流し込む（解析を難しくする）
        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();
    } catch (e) {
        res.status(500).send("Error");
    }
}
export default async function handler(req, res) {
    const { url } = req.query; // ここにはBase64化されたURLが届く
    try {
        const decodedUrl = Buffer.from(url, 'base64').toString();
        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }
        });

        const text = await response.text();
        // 中身を完全にBase64にして「ただの文字列」として返す
        const encodedContent = Buffer.from(text).toString('base64');
        
        res.status(200).json({ content: encodedContent });
    } catch (e) {
        res.status(500).json({ error: "failed" });
    }
}
