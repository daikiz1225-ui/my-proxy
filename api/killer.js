// api/killer.js
(function() {
    console.log("⚔️ Killer Script Loaded");

    // 1. 変数の凍結（Lock）
    // サイト側が「isAdBlockActive = true」に書き換えようとするのを防ぐ
    function lockVar(name, value) {
        Object.defineProperty(window, name, {
            value: value,
            writable: false, // 書き換え禁止
            configurable: false
        });
    }

    lockVar('isAdBlockActive', false);
    lockVar('canRunAds', true);
    lockVar('abp', false);
    
    // 2. 広告変数のダミー化
    // 「adsbygoogle」がないと騒ぐサイトを黙らせる
    window.adsbygoogle = {
        push: function() { return {}; },
        loaded: true,
        length: 1
    };
    window.ga = function() {};
    window.google_ad_client = "ca-pub-0000000000000000";

    // 3. 通信のハイジャック (Fetch & XHR)
    // サイトが「広告URL」にアクセスしてブロックされるか試すのを検知し、
    // 実際にはアクセスせずに「成功（200 OK）」と嘘をつく
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
        const u = url.toString();
        if (u.includes('doubleclick') || u.includes('googlesyndication') || u.includes('ads') || u.includes('analyze')) {
            console.log("Mocking success for:", u);
            return new Response("ok", { status: 200 });
        }
        return originalFetch(url, options);
    };

    // 4. 強制スタイル注入
    // それでも警告画面が出た時のために、CSSで「オーバーレイ」を透明にする
    const style = document.createElement('style');
    style.innerHTML = `
        .adsbygoogle { display: block !important; height: 1px !important; opacity: 0 !important; }
        [id*="sp_overlay"], [id*="ad_block"], [class*="anti-adblock"], [class*="popup"] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            z-index: -9999 !important;
        }
        body { overflow: auto !important; position: static !important; }
    `;
    document.head.appendChild(style);

})();
