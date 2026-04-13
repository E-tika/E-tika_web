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

// 📄 PDF発行：スマホ対策を施したバージョン
async function viewPdf(fileName, yearLabel, isNewTab = false) {
    // 期限を少し余裕を持って120秒に設定
    const { data, error } = await _supabase
        .storage
        .from('past-exams')
        .createSignedUrl(fileName, 120);

    if (error) {
        alert('PDFの取得に失敗しました。');
        return;
    }

    const secureUrl = data.signedUrl;

    // ✨ スマホ・タブレットかどうかを判定する
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // 「別タブで開くボタンが押された」または「スマホからのアクセス」なら別タブで開く
    if (isNewTab || isMobile) {
        window.open(secureUrl, '_blank');
    } else {
        // PCの場合はこれまで通りプレビュー表示
        const iframe = document.getElementById('pdf-preview-frame');
        iframe.src = secureUrl;
        document.getElementById('preview-title').innerText = yearLabel + " のプレビュー";
        document.getElementById('preview-container').scrollIntoView({ behavior: 'smooth' });
    }
}
