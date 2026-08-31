// 1. Supabaseの初期設定
// const SUPABASE_URL = 'https://nwiufckjdgmllnusvvex.supabase.co';
// const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aXVmY2tqZGdtbGxudXN2dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzU1ODgsImV4cCI6MjA5MDg1MTU4OH0.RqMrRuMLL3ZC3JJgDAHvFbBiAqmAgyH0e32luy-Dhd8'; // あなたのanon key
// const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 一時避難用
// const SB_URL = 'https://srorqnnvmjamzbjfqlfw.supabase.co';
// const SB_API_KEY= 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyb3Jxbm52bWphbXpiamZxbGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NDQ2OTgsImV4cCI6MjEwMTAyMDY5OH0._ils3YLiQE2GogCBhA5OKVjhsx427gBr1fo56Oe_nao';
// const _supabase = supabase.createClient(SB_URL, SB_API_KEY);

// GCSのバケット名を定義
const BUCKET_NAME = 'past-exam';

// 🚪 門番：ページを開いた瞬間にログインチェック
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
    }
});

/**
 * GCSの公開URLを生成するヘルパー関数
 * @param {string} filePath - GCS上のファイルパス (例: '2025/keiryo_keizai1_2025.pdf')
 */
function getGcsUrl(filePath) {
    return `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;
}

/**
 * PDFを表示または開く関数
 * @param {string} fileName - GCS上のファイルパス (例: '2025/keiryo_keizai1_2025.pdf')
 * @param {string} titleLabel - 表示用のラベル名
 * @param {boolean} isNewTab - 別タブで開くかどうか
 * @param {HTMLElement} btnElement - 押されたボタンの要素 (ローディング表示用)
 */
async function viewPdf(fileName, titleLabel, isNewTab = true, btnElement = null) {
    // ローディング表示（連打防止）
    let originalText = '';
    if (btnElement) {
        originalText = btnElement.innerText;
        btnElement.innerText = '取得中...';
        btnElement.style.pointerEvents = 'none';
    }

    try {
        // GCSの公開URLを直接生成（SupabaseのAPI呼び出しは不要）
        const publicUrl = getGcsUrl(fileName);
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // PDFを開く（スマホはポップアップブロック対策で同一タブ遷移、PCは別タブ）
        if (isMobile) {
            window.location.href = publicUrl;
        } else {
            window.open(publicUrl, '_blank', 'noopener,noreferrer');
        }

    } catch (err) {
        console.error('PDF取得エラー:', err);
        alert('通信エラーが発生しました。');
    } finally {
        // ローディング表示を元に戻す
        if (btnElement) {
            btnElement.innerText = originalText;
            btnElement.style.pointerEvents = 'auto';
        }
    }
}

/**
 * プレビュー画面を閉じる関数
 */
function closePreview() {
    const previewContainer = document.getElementById('preview-container');
    const iframe = document.getElementById('pdf-preview-frame');
    
    // 非表示にしてiframeの読み込みも解除
    if (previewContainer) previewContainer.classList.add('hidden');
    if (iframe) iframe.src = '';
}

/**
 * 学期（前期 / 後期）を切り替える関数
 * @param {string} termId - 'zenki' または 'kouki'
 */
function switchTerm(termId) {
    // 1. 全てのコンテンツを非表示にする
    const contents = document.querySelectorAll('.term-content');
    contents.forEach(content => content.classList.remove('active'));

    // 2. 全てのタブの選択状態を解除する
    const tabs = document.querySelectorAll('.term-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // 3. 選択された学期のコンテンツとタブを表示・活性化する
    const selectedContent = document.getElementById(`term-${termId}`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }

    // クリックされたボタン要素に active クラスを付与
    const clickedTab = event ? event.currentTarget : null;
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
}

// 選択状態の変更を監視してボタンの有効化＆件数更新
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('exam-checkbox')) {
        updateBulkButtonState();
    }
});

// 現在表示されている学期（Activeタブ）内のチェックボックス状態を更新
function updateBulkButtonState() {
    const activeTerm = document.querySelector('.term-content.active') || document;
    const checkedBoxes = activeTerm.querySelectorAll('.exam-checkbox:checked');
    const countSpan = document.getElementById('selected-count');
    const bulkBtn = document.getElementById('bulk-download-btn');

    if (countSpan) countSpan.textContent = checkedBoxes.length;
    if (bulkBtn) {
        bulkBtn.disabled = checkedBoxes.length === 0;
        if (checkedBoxes.length === 0) {
            bulkBtn.textContent = "選択した過去問を一括ダウンロード ( 0 )";
        } else {
            bulkBtn.textContent = `選択した過去問を一括ダウンロード ( ${checkedBoxes.length} )`;
        }
    }
}

// 「すべて選択」のトグル動作
function toggleSelectAll(selectAllCheckbox) {
    const activeTerm = document.querySelector('.term-content.active') || document;
    const checkboxes = activeTerm.querySelectorAll('.exam-checkbox');
    
    checkboxes.forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
    });
    updateBulkButtonState();
}

// 選択されたPDFを取得してZIP化＆一括ダウンロード
async function downloadSelectedPdfs() {
    const activeTerm = document.querySelector('.term-content.active') || document;
    const checkedBoxes = activeTerm.querySelectorAll('.exam-checkbox:checked');
    
    if (checkedBoxes.length === 0) return;

    const bulkBtn = document.getElementById('bulk-download-btn');
    bulkBtn.disabled = true;
    bulkBtn.textContent = "ZIP作成中...";

    const zip = new JSZip();

    try {
        for (const cb of checkedBoxes) {
            const fileName = cb.getAttribute('data-file'); // 例: "2025/keiryo_keizai1_2025.pdf"
            const customTitle = cb.getAttribute('data-title') || fileName.split('/').pop().replace('.pdf', '');

            // 1. GCSの公開URLを取得
            const publicUrl = getGcsUrl(fileName);

            // 2. ブラウザでPDFデータを直接取得
            const encodedUrl = encodeURI(publicUrl);
            const response = await fetch(encodedUrl);

            if (!response.ok) {
                console.error(`取得失敗URL: ${encodedUrl} (Status: ${response.status})`);
                throw new Error(`ファイル取得失敗: ${response.statusText}`);
            }
            const blob = await response.blob();
            
            // 3. ZIPにファイルを追加
            const safeFileName = customTitle.endsWith('.pdf') ? customTitle : `${customTitle}.pdf`;
            zip.file(safeFileName, blob);
        }

        // ZIPファイルの生成とダウンロード実行
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "kakomon_archive.zip");

    } catch (err) {
        console.error("ダウンロードエラー:", err);
        alert("過去問の一括ダウンロードに失敗しました。ファイルがGCS上に存在するか確認してください。");
    } finally {
        bulkBtn.disabled = false;
        updateBulkButtonState();
    }
}

// 💡 ヒントの開閉処理
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.hint-toggle-btn');
        if (!btn) return;

        const subjectHeader = btn.closest('.subject-header') || btn.parentElement;
        const hintBox = subjectHeader.nextElementSibling?.classList.contains('hint-box')
            ? subjectHeader.nextElementSibling
            : btn.closest('.subject-group')?.querySelector('.hint-box');

        if (!hintBox) {
            console.warn("💡ヒントボックス (.hint-box) が見つかりませんでした。HTML構造を確認してください。");
            return;
        }

        if (hintBox.hasAttribute('hidden')) {
            hintBox.removeAttribute('hidden');
            btn.setAttribute('aria-expanded', 'true');
        } else {
            hintBox.setAttribute('hidden', '');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
});