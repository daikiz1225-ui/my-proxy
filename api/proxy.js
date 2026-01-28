<script>
    if ('serviceWorker' in navigator) {
        // scopeを明確にして、確実に支配下に置く
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(reg => {
            reg.update(); // 常に最新の状態に更新
            console.log('SW Ready');
        });
    }

    const launch = () => {
        let val = document.getElementById('u').value.trim();
        if (!val) return;
        if (!val.startsWith('http')) val = 'https://' + val;
        
        // URLを「btoa」でエンコードして、特殊文字エラーを防ぐ
        const encoded = btoa(val).replace(/\//g, '_').replace(/\+/g, '-');
        document.getElementById('f').src = "/proxy/" + encoded;
    };

    document.getElementById('go').onclick = launch;
    document.getElementById('u').onkeypress = (e) => { if(e.key === 'Enter') launch(); };
</script>
