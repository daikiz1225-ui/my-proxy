// 動画の読み込みエラーを無視させる
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'VIDEO') {
        console.log("Video Error Bypassed");
        e.preventDefault();
    }
}, true);
