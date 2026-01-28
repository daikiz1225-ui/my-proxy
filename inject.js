(function() {
    // オフライン偽装を解除
    Object.defineProperty(navigator, 'onLine', { get: () => true });

    // CSSの崩れを強引に直すためのスタイル注入
    const style = document.createElement('style');
    style.innerHTML = `
        img#logo, .ytd-logo { max-width: 120px !important; height: auto !important; }
        video { width: 100% !important; height: auto !important; }
    `;
    document.head.appendChild(style);

    // リンクを全部Base64に書き換え
    setInterval(() => {
        document.querySelectorAll('a').forEach(a => {
            if (a.href && a.href.startsWith('http') && !a.href.includes(location.host)) {
                const b64 = btoa(unescape(encodeURIComponent(a.href))).replace(/\//g, '_').replace(/\+/g, '-');
                a.href = window.location.origin + '/proxy/' + b64;
            }
        });
    }, 1500);
})();
