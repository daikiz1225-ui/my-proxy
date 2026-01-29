<script>
    // 1. YouTubeをオンラインだと騙し続ける（基本）
    Object.defineProperty(navigator, 'onLine', { get: () => true });
    setInterval(() => {
        if (window.ytcfg) {
            window.ytcfg.set('CONNECTED', true);
            window.ytcfg.set('OFFLINE_MODE', false);
        }
    }, 500);

    // 2. リンクの「書き換え」を徹底する
    const proxyUrl = (originalUrl) => {
        if (!originalUrl || originalUrl.startsWith('javascript:') || originalUrl.includes(location.host)) return originalUrl;
        try {
            // 相対パスを絶対パスに変換
            const absoluteUrl = new URL(originalUrl, window.location.href).href;
            // Base64でエンコードしてプロキシURLを作る
            const encoded = btoa(unescape(encodeURIComponent(absoluteUrl))).replace(/\//g, '_').replace(/\+/g, '-');
            return "/api/proxy?url=" + encoded;
        } catch (e) { return originalUrl; }
    };

    // 画面内のすべてのクリックを監視して、外に逃げようとしたらプロキシに引き戻す
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (a && a.href) {
            const newHref = proxyUrl(a.href);
            if (newHref !== a.href) {
                e.preventDefault(); // 元の移動をキャンセル
                window.location.href = newHref; // プロキシ経由で移動
            }
        }
    }, true);

    // フォーム送信（検索など）もプロキシ経由にする
    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (form.action && !form.action.includes(location.host)) {
            e.preventDefault();
            const newAction = proxyUrl(form.action);
            window.location.href = newAction + (form.method === 'get' ? '?' + new URLSearchParams(new FormData(form)).toString() : '');
        }
    }, true);
</script>
