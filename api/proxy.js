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
            
            // ★だいきのアイデア：クリックされた瞬間、URLをプロキシ用に変換して飛ばす魔法のスクリプト
            const clickStealer = `
            <script>
            document.addEventListener('click', e => {
                const a = e.target.closest('a');
                if (a && a.href && !a.href.includes(location.host)) {
                    e.preventDefault(); // 普通の移動をキャンセル
                    const targetUrl = a.href;
                    // URLをBase64化してプロキシへ再送
                    const enc = btoa(unescape(encodeURIComponent(targetUrl))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    window.location.href = "/api/proxy?url=" + enc;
                }
            }, true);
            </script>`;

            // HTMLの書き換えは一切せず、このスクリプトを先頭に差し込むだけ
            return res.send(clickStealer + html);
        }

        const ab = await response.arrayBuffer();
        return res.send(Buffer.from(ab));

    } catch (e) {
        return res.send("Error: " + e.message);
    }
}
