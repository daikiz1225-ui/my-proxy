const http = require('http');
const https = require('https');

const server = http.createServer((req, res) => {
  const urlParams = new URL(req.url, `http://${req.headers.host}`);
  const target = urlParams.searchParams.get('url');

  if (!target) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<h1>KICK-Proxy Ready!</h1><p>?url=https://... を付けてアクセスしてね</p>');
  }

  const protocol = target.startsWith('https') ? https : http;
  
  protocol.get(target, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  }).on('error', (e) => {
    res.end('Error: ' + e.message);
  });
});

server.listen(process.env.PORT || 3000);
