export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const decodedUrl = decodeURIComponent(url);
        const response = await fetch(decodedUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': '*/*',
                'Referer': new URL(decodedUrl).origin,
                'Cookie': req.headers.cookie || ''
            }
        });

        res.setHeader('Content-Type', response.headers.get('content-type') || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (e) {
        res.status(500).send("Error");
    }
}
