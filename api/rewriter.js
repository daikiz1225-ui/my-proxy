module.exports = {
    rewrite: function(html, originalUrl) {
        const urlObj = new URL(originalUrl);
        const origin = urlObj.origin;

        // 1. 全てのURL（href, src）を「/api/proxy?url=Base64」形式に置換
        // これで、クリックした瞬間にブラウザが「自分のサイト内の移動だ」と誤認する
        let body = html.replace(/(href|src)="(https?:\/\/[^"]+)"/g, (match, p1, p2) => {
            const b64 = Buffer.from(p2).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
            return `${p1}="/api/proxy?url=${b64}"`;
        });

        // 2. 相対パス（/css/style.cssなど）も絶対パスに直してからプロキシ化
        body = body.replace(/(href|src)="\/(?!\/)([^"]+)"/g, (match, p1, p2) => {
            const absolute = origin + '/' + p2;
            const b64 = Buffer.from(absolute).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
            return `${p1}="/api/proxy?url=${b64}"`;
        });

        return body;
    }
};
