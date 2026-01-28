export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("URLを指定してください");

  const targetUrl = url.startsWith('http') ? url : 'https://' + url;
  const targetOrigin = new URL(targetUrl).origin;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
      }
    });
    let content = await response.text();
    
    // 【強化版】URL書き換えロジック
    // サイト内のあらゆるリンクを自分のVercel経由に強制変換する
    content = content.replace(/(src|href|action)="\/(?!\/)/g, `$1="/proxy/${targetOrigin}/`);
    
    // YouTubeのスクリプトがエラーを吐かないように微調整
    content = content.replace(/integrity="[^"]*"/g, ''); 

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // セキュリティ制限（CSP）を無効化して表示を許可する
    res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';");
    
    res.status(200).send(content);
  } catch (e) {
    res.status(500).send("エラー: " + e.message);
  }
}
