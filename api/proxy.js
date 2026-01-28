const fetch = require('node-fetch');

module.exports = async (req, res) => {
  let targetUrl = req.query.url;
  if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

  try {
    const response = await fetch(targetUrl);
    const content = await response.text();
    
    // 【最重要】サイト内のリンクをすべて自分のプロキシ経由に書き換える
    // これで画像やボタンが動くようになる
    const root = new URL(targetUrl).origin;
    const replaced = content
      .replace(/src="\//g, `src="/proxy/${root}/`)
      .replace(/href="\//g, `href="/proxy/${root}/`);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(replaced);
  } catch (e) {
    res.status(500).send("接続エラー: " + e.message);
  }
};
