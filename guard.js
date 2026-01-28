(function() {
    const forceOnline = () => {
        // 1. 基本のオンライン判定を「常に真」に
        Object.defineProperty(navigator, 'onLine', { get: () => true, configurable: true });
        
        // 2. YouTubeがチェックする「ネットワーク接続API」も偽装
        if (navigator.connection) {
            Object.defineProperty(navigator.connection, 'type', { get: () => 'wifi', configurable: true });
            Object.defineProperty(navigator.connection, 'saveData', { get: () => false, configurable: true });
        }

        // 3. YouTubeに「オンラインになったぞ！」と通知を送り続ける
        window.dispatchEvent(new Event('online'));
    };
    
    forceOnline();
    setInterval(forceOnline, 1000); 
    console.log("YouTube Guard: ONLINE status forced.");
})();
