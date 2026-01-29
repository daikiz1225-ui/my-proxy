export function rewriteHTML(html, origin) {
    const injectScript = `
    <script>
        (function() {
            Object.defineProperty(navigator, 'onLine', { get: () => true });
            
            const proxyUrl = (u) => {
                if(!u || typeof u !== 'string' || u.includes(location.host) || u.startsWith('data:')) return u;
                try {
                    const abs = new URL(u, "${origin}").href;
                    return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
                } catch(e) { return u; }
            };

            // 検索・クリック・メディアを全部まとめて監視
            const fixAll = () => {
                document.querySelectorAll('img, a, form').forEach(el => {
                    if (el.tagName === 'A' && el.href && !el.dataset.px) {
                        el.href = proxyUrl(el.href);
                        el.dataset.px = '1';
                    }
                    if (el.tagName === 'IMG' && el.src && !el.dataset.px) {
                        el.src = proxyUrl(el.src);
                        el.dataset.px = '1';
                    }
                });
            };
            setInterval(fixAll, 1000);

            document.addEventListener('submit', (e) => {
                const action = new URL(e.target.action, location.href).href;
                if (!action.includes(location.host)) {
                    e.preventDefault();
                    const fd = new URLSearchParams(new FormData(e.target)).toString();
                    window.location.href = proxyUrl(action + (action.includes('?') ? '&' : '?') + fd);
                }
            }, true);
        })();
    </script>`;

    // 安全な置換方法に変更
    return html.split('<head>').join('<head>' + injectScript);
}
