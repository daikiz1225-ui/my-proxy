export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("Kick Proxy Online.");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' }
        });

        let html = await response.text();
        const pBase = "/api/proxy?url=";

        // もしBingの検索結果ページだったら、余計なものを削ぎ落として「リンク集」に作り変える
        if (decodedUrl.includes('bing.com/search')) {
            const cleanLinks = [];
            // Bingの検索結果のタイトルとURLを強引に抜き出す
            const regex = /<li class="b_algo">.*?<h2><a href="(.*?)".*?>(.*?)<\/a><\/h2>/g;
            let match;
            while ((match = regex.exec(html)) !== null) {
                const link = match[1];
                const title = match[2].replace(/<[^>]*>?/gm, ''); // タグ除去
                const enc = btoa(unescape(encodeURIComponent(link))).replace(/\//g, '_').replace(/\+/g, '-');
                cleanLinks.push(`
                    <div style="margin: 20px 0; padding: 15px; background: #1a1a1a; border-radius: 10px; border-left: 5px solid #00d4ff;">
                        <a href="${pBase}${enc}" style="color: #00d4ff; text-decoration: none; font-size: 20px; font-weight: bold;">${title}</a>
                        <div style="color: #888; font-size: 12px; margin-top: 5px;">${link}</div>
                    </div>
                `);
            }

            const resultHtml = `
                <body style="background: #0a0a0a; color: white; font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #555;">Kick Search Results</h2>
                    ${cleanLinks.length > 0 ? cleanLinks.join('') : "<p>結果が見つかりませんでした。URLを直接入力するか、別のワードで試してください。</p>"}
                    <hr style="border: 0; border-top: 1px solid #333; margin-top: 40px;">
                    <button onclick="history.back()" style="background: #333; color: white; border: none; padding: 10px 20px; border-radius: 5px;">戻る</button>
                </body>
            `;
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            return res.send(resultHtml);
        }

        // 普通のサイトの場合は、今まで通りリンクを書き換えて表示
        const origin = new URL(decodedUrl).origin;
        html = html.replace(/(src|href)="([^"]+)"/ig, (match, attr, val) => {
            try {
                const fullUrl = new URL(val, origin).href;
                const enc = btoa(unescape(encodeURIComponent(fullUrl))).replace(/\//g, '_').replace(/\+/g, '-');
                return `${attr}="${pBase}${enc}"`;
            } catch(e) { return match; }
        });

        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        return res.send(html);

    } catch (e) {
        return res.send("Error: " + e.message);
    }
}
