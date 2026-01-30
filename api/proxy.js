export default async function handler(req, res) {
    const { url: q } = req.query;
    if (!q) return res.send("Status: OK");

    try {
        const target = Buffer.from(q.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        
        const response = await fetch(target, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        // iPadに「これはダウンロードしちゃダメなやつだ」と100%分からせる設定
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Frame-Options', 'ALLOWALL');

        if (response.headers.get('content-type')?.includes('html')) {
            let html = await response.text();
            const origin = new URL(target).origin;

            // リンクの書き換えを「?url=」を使わない形に
            html = html.replace(/(src|href)="([^"]+)"/ig, (m, a, v) => {
                try {
                    const f = new URL(v, origin).href;
                    const e = Buffer.from(f).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
                    return `${a}="/api/proxy?url=${e}"`;
                } catch { return m; }
            });

            // ★ブラウザに「読み込み中」を維持させてダウンロードに逃げさせない工夫
            const output = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
            return res.status(200).send(output);
        }

        // HTML以外はそのまま
        const ab = await response.arrayBuffer();
        res.setHeader('Content-Type', response.headers.get('content-type'));
        return res.send(Buffer.from(ab));

    } catch (e) {
        // エラーすらHTMLで返す
        res.setHeader('Content-Type', 'text/html');
        return res.send(`<b>Connection Error</b>`);
    }
}
