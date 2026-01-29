export function blockAds(html) {
    // 広告スクリプトと特定のバナーを削除
    let cleanHtml = html.replace(/<script[^>]*googlesyndication[^>]*><\/script>/gi, '');
    const adStyle = `
    <style>
        ins.adsbygoogle, .ad-slot, #player-ads, .ytd-ad-slot-renderer, #masthead-ad { 
            display: none !important; 
        }
    </style>`;
    return cleanHtml.replace('</head>', adStyle + '</head>');
}
