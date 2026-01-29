export function rewriteHTML(html, origin) {
    const injectScript = `
    <script>
        // 1. YouTubeを騙し続ける
        Object.defineProperty(navigator, 'onLine', { get: () => true });
        setInterval(() => {
            if (window.ytcfg) {
                window.ytcfg.set('CONNECTED', true);
                window.ytcfg.set('OFFLINE_MODE', false);
            }
        }, 500);

        // 2. URLをプロキシ用にエンコードする関数
        const proxyUrl = (u) => {
            if(!u || typeof u !== 'string' || u.includes(location.host) || u.startsWith('data:')) return u;
            try {
                const abs = new URL(u, "${origin}").href;
                return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(abs))).replace(/\\//g, '_').replace(/\\+/g, '-');
            } catch(e) { return u; }
        };

        // 3. 画像や動画の読み込みを高速化（全タグ書き換え）
        const fixMedia = () => {
            document.querySelectorAll('img, source, video').forEach(el => {
                if (el.src && !el.dataset.px) {
                    el.src = proxyUrl(el.src);
                    el.dataset.px = '1';
                }
                if (el.srcset && !el.dataset.px) {
                    el.srcset = el.srcset.split(',').map(s => {
                        const [url, size] = s.trim().split(' ');
                        return proxyUrl(url) + (size ? ' ' + size : '');
                    }).join(', ');
                    el.dataset.px = '1';
                }
            });
        };
        setInterval(fixMedia, 1000);

        // 4. クリックと「検索フォーム」を完全にジャックする
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a');
            if (a && a.href) {
                const newHref = proxyUrl(a.href);
                if (newHref !== a.href) {
                    e.preventDefault();
                    window.location.href = newHref;
                }
            }
        }, true);

        // 検索窓（form）対策
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const action = new URL(form.action, location.href).href;
            if (!action.includes(location.host)) {
                e.preventDefault();
                const formData = new URLSearchParams(new FormData(form)).toString();
                const fullUrl = action + (action.includes('?') ? '&' : '?') + formData;
                window.location.href = proxyUrl(fullUrl);
            }
        }, true);
    </script>
    <style>
        #player-ads, .ad-slot, #masthead-ad { display: none !important; }
        img { transition: opacity 0.3s; } /* 画像がパッと出るように */
    </style>`;

    // サーバーサイドでも、できるだけsrcを書き換えてから送る（高速化のコツ）
    let modifiedHtml = html.replace(/(src|href)="\\/(?!\\/)/g, \`$1="\${origin}/\`);
    return modifiedHtml.replace('<head>', '<head>' + injectScript);
}
