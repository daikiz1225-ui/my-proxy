export default async function handler(req, res) {
  // URLを取得
  const { url } = req.query;
  if (!url) return res.status(400).send("URLを指定してください");

  const targetUrl = url.startsWith('http') ? url : 'https://' + url;

  try {
    // Vercel標準のfetchを使用（node-fetch不要）
    const response = await fetch(targetUrl);
    const content = await response.text();
    
    // 中身のURLを自分のプロキシ経由に書き換え
    const root = new URL(targetUrl).origin;
    const replaced = content
      .replace(/src="\//g, `src="/proxy/${root}/`)
      .replace(/href="\//g, `href="/proxy/${root}/`);

    // ヘッダーを設定して画面を返す
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(replaced);
  } catch (e) {
    res.status(500).send("エラーが発生しました: " + e.message);
  }
}
