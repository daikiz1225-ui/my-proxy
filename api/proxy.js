export default async function handler(req, res) {
    const { url: q } = req.query;
    // URLがない場合はDuckDuckGo Liteへ（JavaScriptなしの検索結果）
    const target = q ? Buffer.from(q.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString() 
                     : "https://html.duckduckgo.com/html/";

    try {
        const r = await fetch(target, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        let ct = r.headers.get('content-type') || '';
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.setHeader('Content-Disposition', 'inline');

        if (ct.includes('html')) {
            let h = await r.text();
            const b = "/api/proxy?url=";

            // ★ DuckDuckGoのリンクを全部プロキシ経由に書き換える
            const s = `<script>
                document.addEventListener('click', e => {
                    const a = e.target.closest('a');
                    if (a && a.href && !a.href.includes(location.host)) {
                        e.preventDefault();
                        // DuckDuckGoの転送用URLを飛ばして、直接サイトへ
                        const u = new URL(a.href);
                        let realUrl = u.searchParams.get('uddg') || a.href;
                        const enc = btoa(unescape(encodeURIComponent(realUrl))).replace(/\\//g, '_').replace(/\\+/g, '-');
                        location.href = "${b}" + enc;
                    }
                }, true);
            </script>`;

            return res.send(s + h);
        }

        const ab = await r.arrayBuffer();
        res.setHeader('Content-Type', ct);
        return res.send(Buffer.from(ab));
    } catch (e) {
        return res.send("Error");
    }
}
