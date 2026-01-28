// これは api/proxy.js の中から呼び出すか、
// または個別のAPIとして機能させる
export function rewriteHTML(html, origin) {
    // 1. 全てのURLを絶対パスに
    let rewritten = html.replace(/(src|href)="\/(?!\/)/g, `$1="${origin}/`);
    
    // 2. JavaScriptで動くリンクも横取りするスクリプトを注入
    const injector = `
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
    
    return rewritten.replace('</head>', injector + '</head>');
}
