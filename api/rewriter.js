module.exports = {
    rewrite: function(html, originalUrl) {
        const urlObj = new URL(originalUrl);
        const origin = urlObj.origin;

        const pokiAdvancedScript = `
        <script>
            (function() {
                const wrap = (url) => {
                    if(!url || typeof url !== 'string' || url.startsWith('data:') || url.includes(location.host)) return url;
                    try {
                        const abs = new URL(url, "${origin}").href;
                        return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    } catch(e) { return url; }
                };

                // 1. 全てのURL、iframe、スクリプトの行き先をプロキシへ強制
                const fastProxy = () => {
                    document.querySelectorAll('a, iframe, embed, source').forEach(el => {
                        const attr = el.tagName === 'A' ? 'href' : 'src';
                        if (el[attr] && !el[attr].includes(location.host)) {
                            el[attr] = wrap(el[attr]);
                        }
                    });
                };

                // 2. JavaScriptの「窓」をハック (ここがPoki攻略の鍵)
                const originalOpen = window.open;
                window.open = function(url) { return originalOpen(wrap(url)); };
                
                // 3. 通信の心臓部をジャック
                const { fetch: originalFetch } = window;
                window.fetch = async (...args) => {
                    args[0] = wrap(args[0]);
                    return originalFetch(...args);
                };

                // 4. 親からの命令（矢印ボタン）
                window.addEventListener('message', e => {
                    if(e.data === 'back') history.back();
                    if(e.data === 'forward') history.forward();
                    if(e.data === 'reload') location.reload();
                });

                setInterval(fastProxy, 300); // 爆速で書き換え
            })();
        </script>`;

        let body = html.replace(/(src|href)="\/(?!\/)/g, `$1="${origin}/`);
        return body.replace('<head>', '<head>' + pokiAdvancedScript);
    }
};
