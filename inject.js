(function() {
    function rewrite() {
        // すべてのリンク (aタグ) を書き換え
        document.querySelectorAll('a').forEach(a => {
            if (a.href && a.href.startsWith('http') && !a.href.includes(location.host)) {
                a.href = window.location.origin + '/proxy/' + encodeURIComponent(a.href);
            }
        });
        // すべての画像 (imgタグ) を書き換え
        document.querySelectorAll('img').forEach(img => {
            if (img.src && img.src.startsWith('http') && !img.src.includes(location.host)) {
                img.src = window.location.origin + '/proxy/' + encodeURIComponent(img.src);
            }
        });
    }
    // ページが変わるたびに実行
    setInterval(rewrite, 1000);
})();
