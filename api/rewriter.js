export function rewriteHTML(html, origin) {
    const injectScript = `
    <script>
        // オンライン偽装
        Object.defineProperty(navigator, 'onLine', { get: () => true });
        setInterval(() => {
            if (window.ytcfg) {
                window.ytcfg.set('CONNECTED', true);
                window.ytcfg.set('OFFLINE_MODE', false);
            }
        }, 500);

        // 強制プロキシ移動（ブロック回避）
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a');
            if (a && a.href && !a.href.includes(location.host)) {
                e.preventDefault();
                const encoded = btoa(unescape(encodeURIComponent(new URL(a.href, location.href).href))).replace(/\\//g, '_').replace(/\\+/g, '-');
                window.location.href = "/api/proxy?url=" + encoded;
            }
        }, true);
    </script>
    <style>#player-ads, .ad-slot { display: none !important; }</style>`;

    return html.replace('<head>', '<head>' + injectScript);
}
