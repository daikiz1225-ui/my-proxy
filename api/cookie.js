export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL");

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }
        });
        // 相手のサイトから送られてきたCookieをそのままiPadに流す
        const cookies = response.headers.get('set-cookie');
        if (cookies) res.setHeader('Set-Cookie', cookies);
        res.status(200).send("OK");
    } catch (e) {
        res.status(500).send("Cookie Error");
    }
}
