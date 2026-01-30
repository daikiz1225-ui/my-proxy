export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("Kick Proxy Active");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        // HTMLかどうか判定
        let contentType = response.headers.get('content-type') || '';
        
        // ★ダウンロード防止：HTMLと判定されたら強制的に表示モードにする
        if (contentType.includes('text/html') || decodedUrl.includes('bing.com')) {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.setHeader('Content-Disposition', 'inline');
            
            let html = await response.text();
            const pBase = "/api/proxy?url=";

            // ★だいきの動画の現象を解決する「タップ横取りスクリプト」
            const script = `
            <script>
            (function() {
                const encode = (u) => btoa(unescape(encodeURIComponent(u))).replace(/\\//g, '_').replace(/\\+/g, '-');
                const P_URL = "${pBase}";

                function intercept() {
                    document.querySelectorAll('a').forEach(a => {
                        // まだ書き換えていない外部リンクを対象にする
                        if (a.href && a.href.startsWith('http') && !a.href.includes(location.host)) {
                            const target = a.href;
                            
                            // 1. 属性を上書きして長押し対策
                            a.href = P_URL + encode(target);
                            a.setAttribute('data-proxy', 'true');

                            // 2. タップした瞬間にBingのスクリプトより先にジャンプする（バブリング阻止）
                            a.onmousedown = a.ontouchstart = (e) => {
                                // BingにURLを書き換えられる前に自力で飛ばす
                                window.location.href = P_URL + encode(target);
                                e.preventDefault();
                                e.stopPropagation();
                            };
                        }
                    });
                }

                // 爆速で監視（0.2秒ごと）
                setInterval(intercept, 200);
            })();
            </script>`;

            return res.send(script + html);
        }

        // 画像やその他のデータはそのまま流す
        res.setHeader('Content-Type', contentType);
        const ab = await response.arrayBuffer();
        return res.send(Buffer.from(ab));

    } catch (e) {
        return res.send("Error: " + e.message);
    }
}
