// 1. Supabaseの初期設定
const SUPABASE_URL = 'https://nwiufckjdgmllnusvvex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aXVmY2tqZGdtbGxudXN2dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzU1ODgsImV4cCI6MjA5MDg1MTU4OH0.RqMrRuMLL3ZC3JJgDAHvFbBiAqmAgyH0e32luy-Dhd8'; // あなたのanon key
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function handleLogin() {
    const studentId = document.getElementById('student-id-input').value.trim();
    const password = document.getElementById('password-input').value;
    const errorMsg = document.getElementById('error-message');

    if (!studentId || !password) {
        errorMsg.innerText = "※学生番号とパスワードを入力してください。";
        errorMsg.style.display = 'block';
        return;
    }

    const { data, error } = await _supabase
        .from('allowed_students')
        .select('student_id')
        .eq('student_id', studentId)
        .eq('password', password)
        .not('password', 'is', null)
        .single();

    if (data) {
        // ✅ ログイン成功：セッションに印を付ける
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'list.html'; // リスト画面へ移動
    } else {
        errorMsg.innerText = "※学生番号またはパスワードが正しくありません。";
        errorMsg.style.display = 'block';
    }
}