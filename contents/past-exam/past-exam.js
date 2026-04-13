// 1. Supabaseの初期設定
const SUPABASE_URL = 'https://nwiufckjdgmllnusvvex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aXVmY2tqZGdtbGxudXN2dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzU1ODgsImV4cCI6MjA5MDg1MTU4OH0.RqMrRuMLL3ZC3JJgDAHvFbBiAqmAgyH0e32luy-Dhd8'; // あなたのanon key
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🚪 門番：ページを開いた瞬間に実行（変更なし）
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
    }
});

// 📄 PDF発行：スマホ対策の最終版
async function viewPdf(fileName, yearLabel, isNewTab = false) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // 1. まず署名付きURLを取得する（ここは共通）
    const { data, error } = await _supabase
        .storage
        .from('past-exams')
        .createSignedUrl(fileName, 120);

    if (error || !data) {
        alert('PDFの取得に失敗しました。');
        return;
    }

    const secureUrl = data.signedUrl;

    // 2. スマホの場合、または「別タブ」指定の場合
    if (isMobile || isNewTab) {
        // 見えないリンクを作って、それをクリックさせることでポップアップブロックを回避
        const link = document.createElement('a');
        link.href = secureUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click(); // ここで実際にクリック！
        document.body.removeChild(link); // 使い終わったら消す
        return;
    }

    // 3. PCでのプレビュー表示（これまで通り）
    const iframe = document.getElementById('pdf-preview-frame');
    iframe.src = secureUrl;
    document.getElementById('preview-title').innerText = yearLabel + " のプレビュー";
    document.getElementById('preview-container').scrollIntoView({ behavior: 'smooth' });
}
