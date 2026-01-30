export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("Kick Proxy Active.");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Referer': origin
            }
        });

        // ★ここが最大の修正点：相手が何を言おうと、HTMLっぽいなら強制的に text/html に書き換える
        let contentType = response.headers.get('content-type') || 'text/html';
        
        // 怪しい時は強制的にブラウザで開ける形式に固定
        if (contentType.includes('application/octet-stream') || contentType === '') {
            contentType = 'text/html; charset=UTF-8';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
        // ダウンロードを徹底的に防ぐヘッダー
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (contentType.includes('text/html')) {
            let html = buffer.toString('utf-8');
            const proxyBase = "/api/proxy?url=";

            // パス書き換え（前回より強化：クエリパラメータも逃さない）
            html = html.replace(/(src|href|srcset|action)="([^"]+)"/g, (match, attr, val) => {
                try {
                    let fullUrl;
                    if (val.startsWith('http')) {
                        fullUrl = val;
                    } else if (val.startsWith('//')) {
                        fullUrl = 'https:' + val;
                    } else {
                        fullUrl = new URL(val, origin).href;
                    }
                    const enc = Buffer.from(fullUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="${proxyBase}${enc}"`;
                } catch(e) { return match; }
            });

            return res.send(html);
        }

        // HTML以外（画像など）はそのまま流す
        return res.send(buffer);

    } catch (e) {
        // エラー時も白い画面やダウンロードにならないよう、ちゃんと文字で出す
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        return res.status(500).send(`<h2>Proxy Error</h2><p>${e.message}</p>`);
    }
}
