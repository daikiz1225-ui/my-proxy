module.exports = {
    rewrite: function(html, originalUrl) {
        const urlObj = new URL(originalUrl);
        const origin = urlObj.origin;

        const injectScript = `
        <script>
            (function() {
                const wrap = (url) => {
                    if(!url || typeof url !== 'string' || url.startsWith('data:') || url.includes(location.host)) return url;
                    try {
                        const abs = new URL(url, "${origin}").href;
                        return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    } catch(e) { return url; }
                };

                // リンク改造
                setInterval(() => {
                    document.querySelectorAll('a').forEach(a => {
                        if(a.href && !a.href.includes(location.host)) a.href = wrap(a.href);
                    });
                }, 1000);

                // YouTubeオンライン偽装
                const fixYT = () => {
                    if (window.ytcfg) {
                        window.ytcfg.set('CONNECTED', true);
                        window.ytcfg.set('OFFLINE_MODE', false);
                    }
                };
                fixYT();
                setInterval(fixYT, 2000);

                // 矢印命令
                window.addEventListener('message', e => {
                    if(e.data === 'back') history.back();
                    if(e.data === 'forward') history.forward();
                    if(e.data === 'reload') location.reload();
                });
            })();
        </script>`;

        let body = html.replace(/(src|href)="\/(?!\/)/g, `$1="${origin}/`);
        // headタグがある場所にスクリプトを差し込む
        if (body.includes('<head>')) {
            return body.replace('<head>', '<head>' + injectScript);
        } else {
            return injectScript + body;
        }
    }
};
