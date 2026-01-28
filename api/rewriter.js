function rewrite(html, originalUrl) {
    const urlObj = new URL(originalUrl);
    const origin = urlObj.origin;
    const injectScript = `
    <script>
        (function() {
            const wrap = (url) => {
                if(!url || typeof url !== 'string' || url.startsWith('data:') || url.includes(location.host)) return url;
                try { return "/api/proxy?url=" + btoa(unescape(encodeURIComponent(new URL(url, "${origin}").href))).replace(/\\//g, '_').replace(/\\+/g, '-'); }
                catch(e) { return url; }
            };
            setInterval(() => {
                document.querySelectorAll('a').forEach(a => { if(a.href && !a.href.includes(location.host)) a.href = wrap(a.href); });
            }, 1000);
            if(window.ytcfg) { window.ytcfg.set('CONNECTED', true); window.ytcfg.set('OFFLINE_MODE', false); }
        })();
    </script>`;
    let body = html.replace(/(src|href)="\/(?!\/)/g, \`$1="\${origin}/\`);
    return body.includes('<head>') ? body.replace('<head>', '<head>' + injectScript) : injectScript + body;
}
module.exports = { rewrite };
