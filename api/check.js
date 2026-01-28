export default function handler(req, res) {
    // YouTubeの生存確認(generate_204)に204(成功)を返す
    res.status(204).setHeader('Access-Control-Allow-Origin', '*').end();
}
