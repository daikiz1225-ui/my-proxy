export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) return res.send("<h1>Kick Search V5</h1><p>Anti-Wall System Ready</p>");

    try {
        const target = Buffer.from(id.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
        const targetUrlObj = new URL(target);

        // サイトを安心させるための偽装ヘッダー
        const headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Referer': targetUrlObj.origin + '/',
            'Origin': targetUrlObj.origin
        };

        const response = await fetch(target, { headers });
        const ct = response.headers.get('content-type') || '';
        res.setHeader('Content-Type', ct);

        if (ct.includes('html')) {
            let html = await response.text();
            const origin = targetUrlObj.origin;

            // 1. リンク修正（いつも通り）
            html = html.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
                try {
                    const abs = new URL(val, origin).href;
                    if (attr === 'src' && /\.(jpg|png|gif|webp|svg|css|js)/.test(abs)) return `${attr}="${abs}"`;
                    const enc = btoa(unescape(encodeURIComponent(abs))).replace(/\//g, '_').replace(/\+/g, '-');
                    return `${attr}="/api/proxy?id=${enc}"`;
                } catch { return m; }
            });

            // 2. 🛡️「警告画面キラー」スクリプト注入
            // 画面の変更を常に監視して、あのポップアップが出たら一瞬で消す！
            const antiWallScript = `
            <script>
                // 1. 広告ブロッカー検知を無効化する変数をセット
                window.adsbygoogle = window.adsbygoogle || [];
                window.adsbygoogle.push = function() {};
                window.google_ad_client = "ca-pub-0000000000000000";
                window.canRunAds = true;
                window.isAdBlockActive = false;

                // 2. 「物理削除」システム
                // 画面に「広告表示の許可」を含む要素が出現したら、即座に削除する
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) { // 要素ノードなら
                                // テキストで判定（あの警告文を狙い撃ち）
                                if (node.innerText && (node.innerText.includes('広告表示の許可') || node.innerText.includes('ブロッカー'))) {
                                    node.remove();
                                    document.body.style.overflow = 'auto'; // スクロール禁止も解除
                                    console.log("Anti-Adblock Wall Destroyed!");
                                }
                                // よくあるオーバーレイのIDやクラス名も狙い撃ち
                                if (node.id && (node.id.includes('popup') || node.id.includes('modal') || node.id.includes('overlay'))) {
                                    // 中身に広告関連の言葉があったら消す
                                    if(node.innerHTML.includes('広告')) {
                                        node.remove();
                                        document.body.style.overflow = 'auto';
                                    }
                                }
                            }
                        });
                    });
                });

                // 監視スタート
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, { childList: true, subtree: true });
                    
                    // すでに表示されてるかもしれないから一回掃除
                    document.querySelectorAll('div, section, iframe').forEach(el => {
                        if(el.innerText && el.innerText.includes('広告表示の許可')) {
                            el.remove();
                            document.body.style.overflow = 'auto';
                        }
                    });
                });
            </script>
            <style>
                /* CSSでも無理やり隠す */
                div[class*="overlay"], div[class*="modal"], div[id*="popup"] {
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }
                /* 本文は見えるように戻す */
                body { overflow: auto !important; position: static !important; }
            </style>
            `;

            return res.send(antiWallScript + html);
        }

        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));

    } catch (e) {
        return res.status(500).send("Error: " + e.message);
    }
}
