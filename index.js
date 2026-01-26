const http = require('http');
const https = require('https');

module.exports = (req, res) => {
  const urlParams = new URL(req.url, `https://${req.headers.host}`);
  const target = urlParams.searchParams.get('url');

  if (!target) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<h1>Vercel Proxy Ready!</h1><p>?url=https://... を付けてアクセスしてね</p>');
  }

  const protocol = target.startsWith('https') ? https : http;
  
  protocol.get(target, (proxyRes) => {
    // セキュリティ制限回避のための一部ヘッダー削除
    delete proxyRes.headers['content-security-policy'];
    delete proxyRes.headers['x-frame-options'];
    
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  }).on('error', (e) => {
    res.end('Error: ' + e.message);
  });
};
