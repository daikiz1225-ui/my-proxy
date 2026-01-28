function clean(html) {
    let cleanHtml = html.replace(/<script[^>]*googlesyndication[^>]*><\/script>/gi, '');
    cleanHtml = cleanHtml.replace(/<script[^>]*google-analytics[^>]*><\/script>/gi, '');
    const adHideStyle = `<style>ins.adsbygoogle, .ad-slot, .ad-container, div[id*="google_ads"], iframe[src*="google"] { display: none !important; }</style>`;
    return cleanHtml.replace('</head>', adHideStyle + '</head>');
}
module.exports = { clean };
