// 1. Supabaseの初期設定
const SUPABASE_URL = 'https://nwiufckjdgmllnusvvex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aXVmY2tqZGdtbGxudXN2dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzU1ODgsImV4cCI6MjA5MDg1MTU4OH0.RqMrRuMLL3ZC3JJgDAHvFbBiAqmAgyH0e32luy-Dhd8'; // あなたのanon key
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🚪 門番：ページを開いた瞬間に実行
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        // セッションがなければログイン画面へ強制送還
        window.location.href = 'index.html';
    }
});

// 📄 PDF発行：ボタンが押されたら実行
async function viewPdf(fileName, yearLabel, isNewTab = false) {
    const { data, error } = await _supabase
        .storage
        .from('past-exams')
        .createSignedUrl(fileName, 60);

    if (error) {
        alert('PDFの取得に失敗しました。');
        return;
    }

    const secureUrl = data.signedUrl;
    if (isNewTab) {
        window.open(secureUrl, '_blank');
    } else {
        const iframe = document.getElementById('pdf-preview-frame');
        iframe.src = secureUrl;
        document.getElementById('preview-title').innerText = yearLabel + " のプレビュー";
        document.getElementById('preview-container').scrollIntoView({ behavior: 'smooth' });
    }
}
