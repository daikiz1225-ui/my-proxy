// api/adblock.js
module.exports = {
    clean: function(html) {
        // 1. Googleなどの広告スクリプトをタグごと消す
        let cleanHtml = html.replace(/<script[^>]*googlesyndication[^>]*><\/script>/gi, '');
        cleanHtml = cleanHtml.replace(/<script[^>]*google-analytics[^>]*><\/script>/gi, '');
        
        // 2. 邪魔なディスプレイ広告の枠を消すスタイルを注入
        const adHideStyle = `
        <style>
            ins.adsbygoogle, .ad-slot, .ad-container, div[id*="google_ads"], 
            iframe[src*="google"], .ads-section { display: none !important; visibility: hidden !important; }
        </style>`;
        
        return cleanHtml.replace('</head>', adHideStyle + '</head>');
    }
};
