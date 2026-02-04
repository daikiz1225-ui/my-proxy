export default async function handler(req, res) {
    const { id } = req.query;

    // --- 1. 専用ファイル(killer.js)のふりをする機能 ---
    if (id === 'killer') {
        res.setHeader('Content-Type', 'application/javascript');
        return res.send(`
            (function() {
                console.log("⚔️ Killer Script Active");
                window.adsbygoogle = { push: function() { return {}; }, loaded: true };
                window.isAdBlockActive = false;
                window.canRunAds = true;
                setInterval(() => {
                    document.querySelectorAll('div, section, iframe').forEach(el => {
                        const text = el.innerText || "";
                        if (text.includes('広告表示') || text.includes('ブロッカー')) {
                            el.remove();
                            document.body.style.overflow = 'auto';
                        }
                    });
                }, 500);
            })();
        `);
    }

    if (!id) return res.send("Kick Search Ready");

    try {
        // URLの復元
        const target = Buffer.from(id.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const urlObj = new URL(target);

        const response = await fetch(target, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': urlObj.origin + '/'
            }
        });

        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        if (ct.includes('html')) {
            let html = await response.text();
            
            // 対策スクリプトを注入
            const killerTag = '<script src="/api/proxy?id=killer"></script>';
            html = html.replace('<head>', '<head>' + killerTag);

            // リンク書き換え (500エラーの原因だった場所を修正)
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    const abs = new URL(val, urlObj.origin).href;
                    // 画像やJSはそのまま
                    if (attr === 'src' && /\.(js|css|png|jpg|gif|svg|woff)/i.test(abs)) {
                        return attr + '="' + abs + '"';
                    }
                    // ページ移動はプロキシ経由
                    const enc = btoa(unescape(encodeURIComponent(abs))).replace(/\//g, '_').replace(/\+/g, '-');
                    return attr + '="/api/proxy?id=' + enc + '"';
                } catch (e) {
                    return m;
                }
            });

            return res.send(html);
        }

        // HTML以外はそのまま返す
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        // エラー内容を表示（デバッグ用）
        return res.status(500).send("Error: " + e.message);
    }
}
