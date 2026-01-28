module.exports = {
    rewrite: function(html, originalUrl) {
        const urlObj = new URL(originalUrl);
        const origin = urlObj.origin;

        const pokiHackScript = `
        <script>
            (function() {
                const wrap = (url) => {
                    if(!url || typeof url !== 'string' || url.startsWith('data:') || url.includes(location.host)) return url;
                    try {
                        const abs = new URL(url, "${origin}").href;
                        return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    } catch(e) { return url; }
                };

                // ★新機能：JavaScriptの通信をすべて横取り
                const orgFetch = window.fetch;
                window.fetch = function() {
                    arguments[0] = wrap(arguments[0]);
                    return orgFetch.apply(this, arguments);
                };

                const orgOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function() {
                    arguments[1] = wrap(arguments[1]);
                    return orgOpen.apply(this, arguments);
                };

                // ★iframeの生成も監視してプロキシ化
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.tagName === 'IFRAME' && node.src && !node.src.includes(location.host)) {
                                node.src = wrap(node.src);
                            }
                        });
                    });
                });
                observer.observe(document.documentElement, { childList: true, subtree: true });

                // 既存のリンク書き換え
                setInterval(() => {
                    document.querySelectorAll('a').forEach(a => {
                        if(a.href && !a.href.includes(location.host)) a.href = wrap(a.href);
                    });
                }, 500);
            })();
        </script>`;

        let body = html.replace(/(src|href)="\/(?!\/)/g, `$1="${origin}/`);
        return body.replace('<head>', '<head>' + pokiHackScript);
    }
};
