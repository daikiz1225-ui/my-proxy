export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send("URLが必要です");

    // URLを整形
    let targetUrl = url;
    if (!url.startsWith('http')) targetUrl = 'https://' + url;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': req.headers['user-agent'], // iPadの情報をそのまま渡す
                'Accept': req.headers['accept'],
                'Referer': 'https://www.google.com/' // Googleからのアクセスに見せかける
            }
        });

        // 相手のサイトから返ってきた「データの種類（html, css, image等）」をそのまま引き継ぐ
        const contentType = response.headers.get('content-type');
        res.setHeader('Content-Type', contentType);
        
        // セキュリティ制限を解除
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval'; img-src * data:; media-src *;");

        // データをそのまま流し込む（ストリーム）
        const buffer = await response.arrayBuffer();
        res.status(200).send(Buffer.from(buffer));

    } catch (e) {
        res.status(500).send("エラー: " + e.message);
    }
}
