module.exports = {
    rewrite: function(html, originalUrl) {
        const urlObj = new URL(originalUrl);
        const origin = urlObj.origin;

        // プロキシURLを作る関数を文字列として定義
        const proxyWrapScript = `
        <script>
            (function() {
                const wrap = (url) => {
                    if(!url || url.startsWith('data:') || url.startsWith('javascript:') || url.includes(location.host)) return url;
                    try {
                        const abs = new URL(url, "${origin}").href;
                        return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    } catch(e) { return url; }
                };

                // 1. ページ内の全Aタグを物理的に書き換え
                document.querySelectorAll('a').forEach(a => {
                    if(a.href) a.href = wrap(a.href);
                });

                // 2. フォーム送信も書き換え
                document.querySelectorAll('form').forEach(f => {
                    if(f.action) f.action = wrap(f.action);
                });

                // 3. 矢印ボタンが効かない対策（親からのメッセージを待機）
                window.addEventListener('message', e => {
                    if(e.data === 'back') history.back();
                    if(e.data === 'forward') history.forward();
                    if(e.data === 'reload') location.reload();
                });
            })();
        </script>`;

        // 相対パスを絶対パスに置換（404対策）
        let body = html.replace(/(src|href)="\/(?!\/)/g, `$1="${origin}/`);
        
        return body.replace('</head>', proxyWrapScript + '</head>');
    }
};
