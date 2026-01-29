export function rewriteHTML(html, decodedUrl) {
    const origin = new URL(decodedUrl).origin;
    const injectScript = `
    <script>
        (function() {
            // 1. YouTubeを「オンライン」だと信じ込ませる
            Object.defineProperty(navigator, 'onLine', { get: () => true });
            const hackYT = () => {
                if (window.ytcfg) {
                    window.ytcfg.set('CONNECTED', true);
                    window.ytcfg.set('OFFLINE_MODE', false);
                }
            };
            setInterval(hackYT, 500);

            // 2. 全リンクをプロキシ経由に改造（Educationドメイン対策も込み）
            const wrap = (u) => {
                if(!u || typeof u !== 'string' || u.includes(location.host) || u.startsWith('data:')) return u;
                try {
                    const abs = new URL(u, "${origin}").href;
                    return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                } catch(e) { return u; }
            };
            setInterval(() => {
                document.querySelectorAll('a').forEach(a => {
                    if(a.href && !a.dataset.px) { a.href = wrap(a.href); a.dataset.px = '1'; }
                });
            }, 1000);
        })();
    </script>`;

    let modifiedHtml = html.replace(/(src|href)="\/(?!\/)/g, \`$1="\${origin}/\`);
    return modifiedHtml.replace('<head>', '<head>' + injectScript);
}
