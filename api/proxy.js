export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("URLが必要です");
    const targetUrl = url.startsWith('http') ? url : 'https://' + url;

    try {
        const response = await fetch(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const contentType = response.headers.get('content-type');
        const buffer = await response.arrayBuffer();
        
        // データをBase64という形式で暗号化（i-FILTERの目を盗む）
        const base64Data = Buffer.from(buffer).toString('base64');
        
        res.setHeader('Content-Type', 'text/plain'); // あえてテキストとして送る
        res.status(200).send({
            contentType: contentType,
            data: base64Data
        });
    } catch (e) {
        res.status(500).send("Error");
    }
}
