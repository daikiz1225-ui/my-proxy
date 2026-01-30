export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("Kick Proxy Online.");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const targetUrl = new URL(decodedUrl);
        const origin = targetUrl.origin;

        const response = await fetch(decodedUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': '*/*',
                'Referer': origin
            }
        });

        const contentType = response.headers.get('content-type') || '';
        
        // セキュリティ制限をすべて解除してブラウザに「安全だよ」と教える
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.setHeader('Content-Type', contentType);

        if (contentType.includes('text/html')) {
            let html = await response.text();
            const proxyBase = "/api/proxy?url=";

            // リンク、画像、スクリプト、CSSのパスをすべて強制的にプロキシ経由にする
            // / から始まる相対パスも、ちゃんと絶対パスに直してからエンコードする
            html = html.replace(/(src|href|srcset|action)="([^"]+)"/g, (match, attr, val) => {
                try {
                    let fullUrl;
                    if (val.startsWith('http')) {
                        fullUrl = val;
                    } else if (val.startsWith('//')) {
                        fullUrl = 'https:' + val;
                    } else {
                        // 相対パス（/style.css など）を絶対パスに変換
                        fullUrl = new URL(val, origin).href;
                    }
                    
                    const enc = Buffer.from(fullUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="${proxyBase}${enc}"`;
                } catch(e) { return match; }
            });

            // ページ内のスクリプトが元のドメインを呼ぼうとするのを防ぐ
            const inject = `
            <script>
                // ページ内の全通信をキャッチしてプロキシへ流す
                const orgFetch = window.fetch;
                window.fetch = (u, i) => {
                    if (typeof u === 'string' && u.startsWith('http')) {
                        u = "/api/proxy?url=" + btoa(u).replace(/\\//g, '_').replace(/\\+/g, '-');
                    }
                    return orgFetch(u, i);
                };
            </script>`;
            
            return res.send(html + inject);
        }

        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));

    } catch (e) {
        return res.status(500).send("Proxy Error: " + e.message);
    }
}
