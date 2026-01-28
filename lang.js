// YouTubeの内部変数を書き換えて日本語を強制する
window.yt = window.yt || {};
window.ytcfg = window.ytcfg || {};
window.ytcfg.set = window.ytcfg.set || function() {};
document.cookie = "PREF=hl=ja&gl=JP; domain=.youtube.com; path=/";
document.documentElement.lang = "ja";

// i-FILTERの「URLチェック」を回避するために履歴を偽装
history.replaceState(null, '', '/study-mode');
