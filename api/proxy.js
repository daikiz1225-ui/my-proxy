export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("URLが必要です");

    try {
        const response = await fetch(url, {
            method: req.method,
            headers: {
                'User-Agent': req.headers['user-agent'],
                'Accept': req.headers['accept'],
                'Referer': new URL(url).origin
            },
            body: req.method !== 'GET' ? req.body : undefined
        });

        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType || 'text/html');
        res.setHeader('Access-Control-Allow-Origin', '*');

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (e) {
        res.status(500).send("Error");
    }
}
