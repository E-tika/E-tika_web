// 1. Supabaseの初期設定
const SUPABASE_URL = 'https://nwiufckjdgmllnusvvex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aXVmY2tqZGdtbGxudXN2dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzU1ODgsImV4cCI6MjA5MDg1MTU4OH0.RqMrRuMLL3ZC3JJgDAHvFbBiAqmAgyH0e32luy-Dhd8';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function handleLogin() {
    const studentId = document.getElementById('student-id-input').value.trim();
    const password = document.getElementById('password-input').value; // ★パスワード取得
    const errorMsg = document.getElementById('error-message');

    // 未入力チェック
    if (!studentId || !password) {
        errorMsg.innerText = "※学生番号とパスワードを入力してください。";
        errorMsg.style.display = 'block';
        return;
    }

    // 2. データベースに「学籍番号」と「パスワード」の両方が一致するデータがあるか検索
    const { data, error } = await _supabase
        .from('allowed_students')
        .select('student_id')
        .eq('student_id', studentId)
        .eq('password', password) // ★パスワードも検索条件に追加
        .not('password', 'is', null) // ★まだパスワード登録していない人は弾く
        .single();

    if (data) {
        // ✅ ログイン成功！
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userId', studentId); // 誰がログインしたか保持しておくと後で便利です
        window.location.href = 'list.html';
    } else {
        // ❌ ログイン失敗（番号がない、またはパスワード間違い）
        errorMsg.innerText = "※学生番号またはパスワードが正しくありません。";
        errorMsg.style.display = 'block';
        console.error("Auth error:", error);
    }
}
