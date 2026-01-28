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
}export default async function handler(req, res) {
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
