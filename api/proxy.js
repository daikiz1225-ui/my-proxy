export default async function handler(req, res) {
    // 検索ワード(q) または 表示したいURL(url) を取得
    const { q, url } = req.query;
    const pBase = "/api/proxy?url="; // プロキシのベースURL

    // エラー防止のおまじない（ヘッダー設定）
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-store'); // キャッシュさせない

    try {
        // ■ パターンA：検索モード（qがある時）
        if (q) {
            // Bingで検索（HTMLだけもらう）
            const target = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
            const response = await fetch(target, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            const html = await response.text();

            // 検索結果から「タイトル」と「URL」だけを無理やり引っこ抜く
            const results = [];
            // Bingのリンク構造を探す正規表現
            const regex = /<li class="b_algo">.*?<h2><a href="(.*?)".*?>(.*?)<\/a><\/h2>/g;
            let match;
            while ((match = regex.exec(html)) !== null) {
                const linkUrl = match[1];
                const title = match[2].replace(/<[^>]*>?/gm, ''); // 余計なタグを消す
                // リンク先をプロキシ用に暗号化
                const enc = Buffer.from(linkUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                results.push(`
                    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #333; border-radius: 8px; background: #111;">
                        <a href="${pBase}${enc}" style="font-size: 18px; color: #4dabf7; text-decoration: none; font-weight: bold; display:block;">${title}</a>
                        <div style="font-size: 12px; color: #888; margin-top: 5px; word-break: break-all;">${linkUrl}</div>
                    </div>
                `);
            }

            // 自作の検索結果ページを表示
            const page = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                <body style="background:#000; color:#ddd; font-family:sans-serif; padding:10px;">
                    <div style="max-width:600px; margin:0 auto;">
                        <form action="/api/proxy" method="GET" style="margin-bottom:20px; display:flex;">
                            <input name="q" value="${q}" style="flex:1; padding:10px; border-radius:5px 0 0 5px; border:none;">
                            <button style="padding:10px 20px; border-radius:0 5px 5px 0; border:none; background:#4dabf7; color:white;">検索</button>
                        </form>
                        <h3 style="color:#666;">検索結果: ${q}</h3>
                        ${results.join('') || '<p>結果が取得できませんでした。</p>'}
                    </div>
                </body>
                </html>
            `;
            return res.send(page);
        }

        // ■ パターンB：プロキシ閲覧モード（urlがある時）
        if (url) {
            const targetUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
            const response = await fetch(targetUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
            });

            // HTML以外（画像など）はそのまま流す
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('text/html')) {
                res.setHeader('Content-Type', contentType);
                const buffer = await response.arrayBuffer();
                return res.send(Buffer.from(buffer));
            }

            // HTMLの場合：リンクを書き換えて表示
            let html = await response.text();
            const origin = new URL(targetUrl).origin;

            // リンク書き換え（ここもシンプルに）
            html = html.replace(/(href|src)="([^"]+)"/g, (match, attr, val) => {
                try {
                    // 相対パスを絶対パスに
                    const absoluteUrl = new URL(val, origin).href;
                    // プロキシURLに変換
                    const enc = Buffer.from(absoluteUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="${pBase}${enc}"`;
                } catch (e) {
                    return match;
                }
            });

            // ダウンロード回避用：HTMLとして強制出力
            return res.send(html);
        }

        return res.send("Error: No Query");

    } catch (e) {
        // エラーが起きてもHTMLで返す（ダイアログを出させないため）
        return res.send(`<div style="color:red; padding:20px;">エラーが発生しました: ${e.message}</div>`);
    }
}
