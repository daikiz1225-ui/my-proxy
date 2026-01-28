// api/rewriter.js の中の interceptor スクリプトに追加
const ytHacker = `
<script>
    (function() {
        const fixYT = () => {
            if (window.ytcfg) {
                // YouTubeの内部設定を「接続済み」に強制上書き
                if (window.ytcfg.get('INNERTUBE_CONTEXT')) {
                    const ctx = window.ytcfg.get('INNERTUBE_CONTEXT');
                    if (ctx.client) ctx.client.utcOffsetMinutes = 540; // 日本時間
                }
                // オフライン判定のフラグをへし折る
                window.ytcfg.set('CONNECTED', true);
                window.ytcfg.set('OFFLINE_MODE', false);
            }
        };
        // ページ読み込み中も読み込み後も、しつこく書き換え続ける
        fixYT();
        const observer = new MutationObserver(fixYT);
        observer.observe(document.documentElement, { childList: true, subtree: true });
    })();
</script>`;

// 既存のHTMLの <head> のすぐ後ろに入れる
return body.replace('<head>', '<head>' + ytHacker);
