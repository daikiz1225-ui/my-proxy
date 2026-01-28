export default function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send({ status: "Video Optimizer Ready", lang: "ja" });
}
