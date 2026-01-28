(function() {
    // 言語設定を日本に固定
    Object.defineProperty(navigator, 'language', { get: () => 'ja-JP' });

    const style = document.createElement('style');
    style.innerHTML = `
        /* モバイル版の不自然なパーツを隠す */
        .m-upsell-bar, .header-signin-container { display: none !important; }
        body { background-color: #000 !important; color: #fff !important; }
    `;
    document.head.appendChild(style);

    console.log("Mobile YouTube Bypass Active");
})();
