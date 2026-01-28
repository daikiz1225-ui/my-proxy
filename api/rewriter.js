module.exports = {
    rewrite: function(html, originalUrl) {
        const urlObj = new URL(originalUrl);
        
        // 既存のHTML書き換えは最小限にして、バグを防ぐ
        let body = html.replace(/(src|href)="\/(?!\/)/g, `$1="${urlObj.origin}/`);

        // ★これが「飛ぶ瞬間に割り込む」専門のスクリプト
        const interceptor = `
        <script>
            (function() {
                const proxyWrap = (url) => {
                    if (!url || url.includes(location.host) || url.startsWith('data:')) return url;
                    return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(url))).replace(/\\//g, '_').replace(/\\+/g, '-');
                };

                // 1. Aタグのクリックを完全にジャックする
                window.addEventListener('click', e => {
                    const a = e.target.closest('a');
                    if (a && a.href) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        window.location.href = proxyWrap(a.href);
                    }
                }, true);

                // 2. JavaScriptによる画面遷移（location.href = ...）をジャックする
                const originalDescriptor = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href');
                Object.defineProperty(window.location, 'href', {
                    set: (url) => { window.location.assign(proxyWrap(url)); }
                });
            })();
        </script>`;

        return body.replace('<head>', '<head>' + interceptor);
    }
};
