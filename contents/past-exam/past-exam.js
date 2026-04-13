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

    // 1. SupabaseからURLを取得
    const { data, error } = await _supabase
        .storage
        .from('past-exams')
        .createSignedUrl(fileName, 120);

    if (error || !data) {
        alert('PDFの取得に失敗しました。');
        return;
    }

    const secureUrl = data.signedUrl;

    if (isMobile) {
        // 【スマホ用】URLを直接ブラウザの場所（アドレスバー）に叩き込む
        // ユーザーが「タップ」した直後のこの文脈なら、多くのスマホで強制遷移が効きます
        window.location.href = secureUrl;
    } else if (isNewTab) {
        // PCの別タブ用
        window.open(secureUrl, '_blank');
    } else {
        // PCのプレビュー用（これまで通り）
        const iframe = document.getElementById('pdf-preview-frame');
        iframe.src = secureUrl;
        document.getElementById('preview-title').innerText = yearLabel + " のプレビュー";
        document.getElementById('preview-container').scrollIntoView({ behavior: 'smooth' });
    }
}