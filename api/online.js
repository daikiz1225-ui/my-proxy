export default function handler(req, res) {
    // YouTubeが求めている「204 No Content」という成功信号を直接送る
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.status(204).end();
}
