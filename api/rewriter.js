module.exports = {
    rewrite: function(html, originalUrl) {
        const urlObj = new URL(originalUrl);
        const origin = urlObj.origin;

        const adBlockAndProxyScript = `
        <script>
            (function() {
                // 1. プロキシURL変換関数
                const wrap = (url) => {
                    if(!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('javascript:') || url.includes(location.host)) return url;
                    try {
                        const abs = new URL(url, "${origin}").href;
                        return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    } catch(e) { return url; }
                };

                // 2. 広告ブロッカー：邪魔な要素を物理的に削除
                const blockAds = () => {
                    const adSelectors = [
                        'iframe[src*="google"]', 'ins.adsbygoogle', '.ad-slot', '.ad-container',
                        'div[id*="google_ads"]', 'aside', '.sidebar', '.ad-area'
                    ];
                    adSelectors.forEach(s => {
                        document.querySelectorAll(s).forEach(el => el.remove());
                    });
                };

                // 3. リンクの強制改造 (Daikiさん作戦：監視を強化)
                const updateAllLinks = () => {
                    // aタグ
                    document.querySelectorAll('a').forEach(a => {
                        if(a.href && !a.href.includes(location.host)) {
                            a.href = wrap(a.href);
                        }
                    });
                    // ボタン等のクリックイベントも監視
                    document.querySelectorAll('[onclick]').forEach(el => {
                        if(!el.dataset.proxied) {
                            const original = el.getAttribute('onclick');
                            if(original.includes('location.href') || original.includes('window.open')) {
                                // onclickの中身を無理やり置換
                                el.setAttribute('onclick', "const target = wrap('" + original + "'); " + original);
                            }
                            el.dataset.proxied = "true";
                        }
                    });
                };

                // 4. 親からの命令
                window.addEventListener('message', e => {
                    if(e.data === 'back') history.back();
                    if(e.data === 'forward') history.forward();
                    if(e.data === 'reload') location.reload();
                });

                // 高速で監視を実行
                setInterval(() => {
                    blockAds();
                    updateAllLinks();
                }, 500);
                
                blockAds();
                updateAllLinks();
            })();
        </script>`;

        // 相対パスの修正
        let body = html.replace(/(src|href)="\/(?!\/)/g, `$1="${origin}/`);
        
        // 広告系スクリプトを根こそぎ無効化
        body = body.replace(/<script[^>]*src="[^"]*google[^"]*"[^>]*><\/script>/gi, '');
        
        return body.replace('<head>', '<head>' + adBlockAndProxyScript);
    }
};
