export default async function handler(req, res) {
    const { url: q } = req.query;
    const target = q ? Buffer.from(q.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString() 
                     : "https://html.duckduckgo.com/html/";

    try {
        const r = await fetch(target, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const ct = r.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        // 画像やCSSは何もせずそのまま高速返却
        if (!ct.includes('html')) {
            const ab = await r.arrayBuffer();
            return res.send(Buffer.from(ab));
        }

        // --- HTMLの場合：加工を最小限にして爆速で送る ---
        let h = await r.text();
        
        // サーバーでの「一括書き換え」を廃止！
        // 代わりに、iPad側で動く「超軽量な書き換えスクリプト」だけを頭に付ける
        const fastScript = `
        <script>
        (function() {
            const P = "/api/proxy?url=";
            const enc = (u) => btoa(unescape(encodeURIComponent(u))).replace(/\\//g, '_').replace(/\\+/g, '-');

            // クリックされた瞬間にその場で作って飛ぶ（事前書き換えしないからラグがない）
            document.addEventListener('click', e => {
                const a = e.target.closest('a');
                if (a && a.href && !a.href.includes(location.host)) {
                    e.preventDefault();
                    let u = a.href;
                    if (u.includes('uddg=')) u = new URL(u).searchParams.get('uddg');
                    location.href = P + enc(u);
                }
            }, true);

            // 画像のsrcだけは表示のためにサッと修正
            const fix = () => {
                document.querySelectorAll('img:not([data-f])').forEach(img => {
                    if(img.src.startsWith('http')) {
                        // フィルターが画像を止めてないならそのまま、止めてるならPを付ける
                        // 今回は速さ優先でそのまま(または簡単な修正のみ)
                        img.dataset.f = "1";
                    }
                });
            };
            setInterval(fix, 500);
        })();
        </script>`;

        return res.send(fastScript + h);

    } catch (e) {
        return res.send("Error");
    }
}
