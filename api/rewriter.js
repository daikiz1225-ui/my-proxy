module.exports = {
    rewrite: function(html, originalUrl) {
        const origin = new URL(originalUrl).origin;
        // 1. 相対パスを絶対パスに直して404を防ぐ
        let body = html.replace(/(src|href)="\/(?!\/)/g, `$1="${origin}/`);
        
        // 2. ページ内のリンクを無理やりプロキシ経由にするスクリプトを注入
        const inject = `
        <script>
            document.addEventListener('click', e => {
                const a = e.target.closest('a');
                if (a && a.href && !a.href.includes(location.host)) {
                    e.preventDefault();
                    const b64 = btoa(unescape(encodeURIComponent(a.href))).replace(/\\//g, '_').replace(/\\+/g, '-');
                    window.location.href = "/api/proxy?url=" + b64;
                }
            }, true);
        </script>`;
        return body.replace('</head>', inject + '</head>');
    }
};
