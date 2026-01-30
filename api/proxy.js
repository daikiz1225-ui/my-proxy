export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.send("Kick Proxy Active");

    try {
        const decodedUrl = Buffer.from(url.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const origin = new URL(decodedUrl).origin;

        const response = await fetch(decodedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
        });

        const contentType = response.headers.get('content-type') || 'text/html';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');

        if (contentType.includes('text/html')) {
            let html = await response.text();
            
            // ★ここを強化：ページ内の全リンクを監視して強制改変するスクリプト
            const ultimateStealer = `
            <script>
            (function() {
                const P_URL = "/api/proxy?url=";
                const encode = (u) => btoa(unescape(encodeURIComponent(u))).replace(/\\//g, '_').replace(/\\+/g, '-');

                function rewrite() {
                    document.querySelectorAll('a').forEach(a => {
                        // まだプロキシ化されていない外部リンクがあれば書き換える
                        if (a.href && a.href.startsWith('http') && !a.href.includes(location.host)) {
                            const original = a.href;
                            a.href = P_URL + encode(original);
                            // クリックイベントも念のため上書き
                            a.onclick = (e) => {
                                e.preventDefault();
                                window.location.href = P_URL + encode(original);
                            };
                        }
                    });
                }

                // 1. ページ読み込み時に実行
                rewrite();
                // 2. 0.5秒おきに実行（後から出てくるリンク対策）
                setInterval(rewrite, 500);

                // フォーム送信もプロキシ経由にする
                document.addEventListener('submit', e => {
                    const form = e.target;
                    if(form.action && !form.action.includes(location.host)) {
                        e.preventDefault();
                        const u = new URL(form.action);
                        const params = new URLSearchParams(new FormData(form)).toString();
                        window.location.href = P_URL + encode(u.origin + u.pathname + "?" + params);
                    }
                });
            })();
            </script>`;

            return res.send(ultimateStealer + html);
        }

        const ab = await response.arrayBuffer();
        return res.send(Buffer.from(ab));

    } catch (e) {
        return res.send("Error: " + e.message);
    }
}
