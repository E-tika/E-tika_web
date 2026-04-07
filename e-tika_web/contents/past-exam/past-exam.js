// 1. Supabaseの初期設定
const SUPABASE_URL = 'https://nwiufckjdgmllnusvvex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aXVmY2tqZGdtbGxudXN2dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzU1ODgsImV4cCI6MjA5MDg1MTU4OH0.RqMrRuMLL3ZC3JJgDAHvFbBiAqmAgyH0e32luy-Dhd8';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function handleLogin() {
    const studentId = document.getElementById('student-id-input').value;
    const errorMsg = document.getElementById('error-message');

    if (!studentId) return;

    // 2. データベースにその学生番号があるか検索
    const { data, error } = await _supabase
        .from('allowed_students')
        .select('student_id, admission_year')
        .eq('student_id', studentId)
        .single();

    if (data) {
        // ✅ 【重要】関数の「中」で、ジャンプする直前に保存する！
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'list.html';
    } else {
        errorMsg.style.display = 'block';
        console.error("Auth error:", error);
    }
}

