(function() {
    // YouTubeのオフラインチェック機能をだます
    Object.defineProperty(navigator, 'onLine', { get: () => true });
    
    // YouTubeが「ネット繋がってる？」と聞く通信を、常に「OK」と答えるように書き換え
    window.addEventListener('offline', (e) => e.stopImmediatePropagation(), true);
    window.addEventListener('online', (e) => e.stopImmediatePropagation(), true);

    // 日本語設定
    document.cookie = "PREF=hl=ja&gl=JP; domain=.youtube.com; path=/";
})();
