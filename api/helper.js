export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ status: "Helper Active", mode: "Bypass" });
}
