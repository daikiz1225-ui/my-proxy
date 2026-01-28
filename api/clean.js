export default function handler(req, res) {
    // 将来的に特定のjsファイルを空にするために使用
    res.setHeader('Content-Type', 'application/javascript');
    res.send('console.log("Script Cleaned");');
}
