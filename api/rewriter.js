module.exports = {
    rewrite: function(html, originalUrl) {
        const urlObj = new URL(originalUrl);
        const origin = urlObj.origin;

        const proxyWrapScript = `
        <script>
            (function() {
                // 1. URLをBase64プロキシ用に包む関数
                const wrap = (url) => {
                    if(!url || url.startsWith('data:') || url.startsWith('javascript:') || url.includes(location.host)) return url;
                    try {
                        const abs = new URL(url, "${origin}").href;
                        return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    } catch(e) { return url; }
                };

                // 2. ページ内のリンクを全部改造 (Daikiさん作戦)
                const updateLinks = () => {
                    document.querySelectorAll('a').forEach(a => {
                        if(a.href && !a.dataset.proxied) {
                            a.href = wrap(a.href);
                            a.dataset.proxied = "true";
                        }
                    });
                };
                
                // 3. 親からの矢印命令を受け取る
                window.addEventListener('message', e => {
                    if(e.data === 'back') history.back();
                    if(e.data === 'forward') history.forward();
                    if(e.data === 'reload') location.reload();
                });

                // 実行
                updateLinks();
                setInterval(updateLinks, 2000); // 動的に増えるリンクも監視

                // 4. ページ自体のサイズ崩れを防ぐCSS注入
                const style = document.createElement('style');
                style.innerHTML = 'html, body { width: 100% !important; height: auto !important; min-height: 100vh !important; overflow-x: hidden !important; }';
                document.head.appendChild(style);
            })();
        </script>`;

        let body = html.replace(/(src|href)="\/(?!\/)/g, `$1="${origin}/`);
        return body.replace('</head>', proxyWrapScript + '</head>');
    }
};
