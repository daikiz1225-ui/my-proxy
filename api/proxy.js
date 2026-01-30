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
            
            const pBase = "/api/proxy?url=";
            const inject = `
            <script>
            (function() {
                const encode = (u) => btoa(unescape(encodeURIComponent(u))).replace(/\\//g, '_').replace(/\\+/g, '-');

                // リンクの書き換えとクリックの完全乗っ取り
                function fixLinks() {
                    document.querySelectorAll('a').forEach(a => {
                        if (a.href && a.href.startsWith('http') && !a.href.includes(location.host)) {
                            const target = a.href;
                            const proxyUrl = "${pBase}" + encode(target);
                            
                            // 1. hrefを書き換え（長押し対策）
                            a.href = proxyUrl;
                            
                            // 2. クリックイベントを最優先で奪い取る（タップ対策）
                            // Bingのスクリプトより先に動くように true（キャプチャ相）で実行
                            a.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopImmediatePropagation(); // 他のスクリプト（Bing側）を止める
                                window.location.href = proxyUrl;
                                return false;
                            }, true);
                        }
                    });
                }

                // 常に監視
                setInterval(fixLinks, 300);
            })();
            </script>`;

            return res.send(inject + html);
        }

        const ab = await response.arrayBuffer();
        return res.send(Buffer.from(ab));
    } catch (e) {
        return res.send("Error: " + e.message);
    }
}
