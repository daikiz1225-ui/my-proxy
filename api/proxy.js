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
        const base64Data = Buffer.from(buffer).toString('base64');
        
        // i-FILTERが「ただの文字データ」だと勘違いするように、あえて偽装する
        res.setHeader('Content-Type', 'application/json'); 
        res.status(200).send({
            t: contentType,
            d: base64Data
        });
    } catch (e) {
        res.status(500).send("error");
    }
}
