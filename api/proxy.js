export default async function handler(req, res) {
    const { q, url } = req.query;
    const pBase = "/api/proxy?url=";

    // 共通設定：ダウンロード回避のおまじない
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Content-Disposition', 'inline');

    try {
        // ■ 検索モード (DuckDuckGo Liteを使用)
        if (q) {
            // DuckDuckGoのHTML版にアクセス
            const response = await fetch("https://html.duckduckgo.com/html/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                body: `q=${encodeURIComponent(q)}&kl=jp-jp` // 日本語設定
            });
            const html = await response.text();

            // 検索結果を抽出 (DuckDuckGoのクラス名は .result__a)
            const results = [];
            const regex = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/g;
            let match;
            
            while ((match = regex.exec(html)) !== null) {
                let linkUrl = match[1];
                let title = match[2].replace(/<[^>]*>?/gm, '');

                // DuckDuckGoの広告や特殊リンクを除外
                if (linkUrl.startsWith('//') || linkUrl.includes('duckduckgo.com')) continue;

                // URLデコード (DDGはURLエンコードされている場合があるため)
                try { linkUrl = decodeURIComponent(linkUrl); } catch (e) {}

                // プロキシ用に暗号化
                const enc = Buffer.from(linkUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                
                results.push(`
                    <div style="margin-bottom: 15px; padding: 15px; background: #1a1a1a; border-radius: 8px; border-left: 4px solid #00d4ff;">
                        <a href="${pBase}${enc}" style="font-size: 18px; color: #00d4ff; text-decoration: none; font-weight: bold; display:block;">${title}</a>
                        <div style="font-size: 12px; color: #888; margin-top: 5px;">${linkUrl}</div>
                    </div>
                `);
            }

            // 自作検索結果画面
            const ui = `
                <!DOCTYPE html>
                <html>
                <body style="background:#0a0a0a; color:white; font-family:sans-serif; padding:20px;">
                    <button onclick="location.href='/'" style="background:#333; color:white; border:none; padding:8px 15px; border-radius:5px; margin-bottom:20px;">← ホームへ</button>
                    <h2 style="border-bottom:1px solid #333; padding-bottom:10px;">検索: ${q}</h2>
                    ${results.length > 0 ? results.join('') : '<p>検索結果が見つかりませんでした。</p>'}
                </body>
                </html>
            `;
            return res.send(ui);
        }

        // ■ 閲覧モード (URL指定時)
        if (url) {
            const targetUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
            
            const response = await fetch(targetUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
            });

            const contentType = response.headers.get('content-type') || '';

            // 画像などはそのまま流す
            if (!contentType.includes('text/html')) {
                res.setHeader('Content-Type', contentType);
                const buffer = await response.arrayBuffer();
                return res.send(Buffer.from(buffer));
            }

            // HTMLの書き換え
            let html = await response.text();
            const origin = new URL(targetUrl).origin;

            html = html.replace(/(href|src)="([^"]+)"/g, (match, attr, val) => {
                try {
                    // httpから始まる絶対パスに変換
                    const absoluteUrl = new URL(val, origin).href;
                    // プロキシURL化
                    const enc = Buffer.from(absoluteUrl).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="${pBase}${enc}"`;
                } catch { return match; }
            });

            // ダウンロード回避のため、HTMLタグを明示して返す
            return res.send(`<!DOCTYPE html>${html}`);
        }

    } catch (e) {
        return res.send(`<div style="color:white">エラー: ${e.message} <br> <a href="/">戻る</a></div>`);
    }

    return res.send("Status OK");
}
