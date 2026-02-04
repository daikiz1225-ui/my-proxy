export default async function handler(req, res) {
    const { v } = req.query;

    // 1. セットアップ用（これがないと警告が消えない）
    if (v === 'setup') {
        res.setHeader('Content-Type', 'application/javascript');
        return res.send(`(function(){ console.log("System Setup OK"); })();`);
    }

    // 2. URLが入っていない時はこれが出る（404じゃない証拠！）
    if (!v) return res.send("System Online: data.js is here!");

    try {
        const target = Buffer.from(v.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const response = await fetch(target);
        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        if (ct.includes('html')) {
            let html = await response.text();
            // リンクの書き換え（/api/data?v= に飛ばす）
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    const abs = new URL(val, new URL(target).origin).href;
                    if (attr === 'src' && /\\.(js|css|png|jpg|gif)/i.test(abs)) return attr + '="' + abs + '"';
                    const enc = btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    return attr + '="/api/data?v=' + enc + '"';
                } catch { return m; }
            });
            return res.send(html);
        }
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
    } catch (e) {
        return res.send("Fetch Error");
    }
}
