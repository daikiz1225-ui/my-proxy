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
                // 警告画面が出たら即座に消すループ
                setInterval(() => {
                    document.querySelectorAll('div, section, iframe').forEach(el => {
                        if (el.innerText && (el.innerText.includes('広告表示') || el.innerText.includes('ブロッカー'))) {
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
        const target = Buffer.from(id.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const urlObj = new URL(target);

        // --- 2. 徹底的な偽装（リファラーとiPadのふり） ---
        const response = await fetch(target, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': urlObj.origin + '/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        if (ct.includes('html')) {
            let html = await response.text();
            
            // --- 3. さっきの「専用ファイル」を頭にぶち込む ---
            // 自分自身の「killerモード」を読み込ませる
            const killerTag = '<script src="/api/proxy?id=killer"></script>';
            html = html.replace('<head>', '<head>' + killerTag);

            // --- 4. リンク書き換え ---
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    const abs = new URL(val, urlObj.origin).href;
                    if (attr === 'src' && /\\.(js|css|png|jpg|gif|svg)/i.test(abs)) return \`\${attr}="\${abs}"\`;
                    const enc = btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    return \`\${attr}="/api/proxy?id=\${enc}"\`;
                } catch { return m; }
            });

            return res.send(html);
        }

        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        return res.status(500).send("Error");
    }
}
