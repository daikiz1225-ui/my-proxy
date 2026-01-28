(function() {
    const setJp = () => {
        // YouTube用クッキー
        document.cookie = "PREF=hl=ja&gl=JP; domain=.youtube.com; path=/; Max-Age=31536000";
        // 一般的な言語設定
        document.cookie = "hl=ja; path=/; Max-Age=31536000";
        // ブラウザ言語をjaに偽装
        Object.defineProperty(navigator, 'language', { get: () => 'ja', configurable: true });
    };
    setJp();
    console.log("Specialist: Japanese-fix active.");
})();
