// GASのWebアプリURL（デプロイ後のURLに置き換えてください）
const GAS_AUTH_URL = "https://script.google.com/macros/s/AKfycbxWOGkkbFnRnTQ7wd3abof1knhIatjM-WpVz_ja6oeXjL7_g5nSt6VIumS2qUKDpL2H/exec";

// 開発用フラグ（不要になれば false に変更）
const IS_LOCAL_DEV = false; 

async function handleLogin() {
    const studentId = document.getElementById('student-id-input').value.trim();
    const password = document.getElementById('password-input').value;
    const errorMsg = document.getElementById('error-message');

    if (!studentId || !password) {
        errorMsg.innerText = "※学生番号とパスワードを入力してください。";
        errorMsg.style.display = 'block';
        return;
    }

    if (IS_LOCAL_DEV) {
        console.log('⚠️ [LOCAL DEV] 開発用バイパスでログインします');
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = 'list.html';
        return;
    }

    try {
        // GAS APIへ照合リクエスト
        const requestUrl = `${GAS_AUTH_URL}?student_id=${encodeURIComponent(studentId)}&password=${encodeURIComponent(password)}`;
        
        // redirect: "follow" を追加して安全にリダイレクトを処理
        const response = await fetch(requestUrl, {
            method: "GET",
            redirect: "follow"
        });
        
        if (!response.ok) throw new Error("通信エラーが発生しました");

        const result = await response.json();

        if (result.success) {
            // ✅ ログイン成功
            sessionStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'list.html';
        } else {
            // ❌ ログイン失敗
            errorMsg.innerText = "※" + result.message;
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        console.error("ログインエラー:", err);
        errorMsg.innerText = "※通信エラーが発生しました。時間をおいて再試行してください。";
        errorMsg.style.display = 'block';
    }
}