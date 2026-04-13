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

    // 1. スマホの場合、または「別タブで開く」が押された場合
    if (isMobile || isNewTab) {
        // ポップアップブロック回避のため、即座に空のタブを開く
        const newWindow = window.open('', '_blank');
        if (newWindow) newWindow.document.write('過去問を読み込み中...');

        const { data, error } = await _supabase
            .storage
            .from('past-exams')
            .createSignedUrl(fileName, 120);

        if (error || !data) {
            if (newWindow) newWindow.close();
            alert('PDFの取得に失敗しました。');
            return;
        }

        // URLが取得できたら、開いておいたタブをそのURLに切り替える
        if (newWindow) {
            newWindow.location.href = data.signedUrl;
        }
        return; // ここで処理終了
    }

    // 2. PCかつプレビューの場合（これまで通り）
    const { data, error } = await _supabase
        .storage
        .from('past-exams')
        .createSignedUrl(fileName, 120);

    if (error) {
        alert('PDFの取得に失敗しました。');
        return;
    }

    const iframe = document.getElementById('pdf-preview-frame');
    iframe.src = data.signedUrl;
    document.getElementById('preview-title').innerText = yearLabel + " のプレビュー";
    document.getElementById('preview-container').scrollIntoView({ behavior: 'smooth' });
}
