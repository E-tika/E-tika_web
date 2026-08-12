// const SB_URL = "https://nwiufckjdgmllnusvvex.supabase.co";
// const SB_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aXVmY2tqZGdtbGxudXN2dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzU1ODgsImV4cCI6MjA5MDg1MTU4OH0.RqMrRuMLL3ZC3JJgDAHvFbBiAqmAgyH0e32luy-Dhd8".trim();

const SB_URL = "https://srorqnnvmjamzbjfqlfw.supabase.co"
const SB_API_KEY= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyb3Jxbm52bWphbXpiamZxbGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NDQ2OTgsImV4cCI6MjEwMTAyMDY5OH0._ils3YLiQE2GogCBhA5OKVjhsx427gBr1fo56Oe_nao"

const _supabase = supabase.createClient(SB_URL, SB_API_KEY);

const datePicker = document.getElementById('date-picker');
const dateDisplay = document.getElementById('selected-date-display');
const timetableContainer = document.getElementById('timetable-container');

// --- 💡 日付制限の設定 (HTML属性の付与) ---
const todayObj = new Date();
const maxDateObj = new Date();
maxDateObj.setDate(todayObj.getDate() + 30); // 30日後

// YYYY-MM-DD 形式に変換
const todayStr = todayObj.toISOString().split('T')[0];
const maxDateStr = maxDateObj.toISOString().split('T')[0];

// datePicker の選択可能範囲を「今日〜30日後」に制限
datePicker.min = todayStr;
datePicker.max = maxDateStr;

// 初期設定：今日の日付を選択状態にする（※今日が土日祝の場合は初期表示をブロックするケアも実施）
datePicker.value = todayStr;
updateView(todayStr);

// 日付が変わったら表示を更新
datePicker.addEventListener('change', (e) => {
    updateView(e.target.value);
});

async function updateView(selectedDate) {
    if (!selectedDate) return;

    const dateObj = new Date(selectedDate + 'T00:00:00'); // タイムゾーンずれ防止
    const dayOfWeek = dateObj.getDay(); // 0:日曜, 6:土曜

    // --------------------------------------------------
    //  🚫 チェック①：土曜・日曜の判定
    // --------------------------------------------------
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dateDisplay.innerText = `選択した日付: ${selectedDate} (土日不可)`;
        timetableContainer.innerHTML = "<p style='color: red; font-weight: bold;'>⚠️ 土曜・日曜日は予約対象外です。平日を選択してください。</p>";
        return;
    }

    // --------------------------------------------------
    //  🚫 チェック②：日本の祝日判定
    // --------------------------------------------------
    const holidayName = getJapaneseHolidayName(dateObj);
    if (holidayName) {
        dateDisplay.innerText = `選択した日付: ${selectedDate} (${holidayName})`;
        timetableContainer.innerHTML = `<p style='color: red; font-weight: bold;'>⚠️ 祝日（${holidayName}）は予約対象外です。平日を選択してください。</p>`;
        return;
    }

    // --------------------------------------------------
    //  🚫 チェック③：30日以上先・過去の判定（直接入力等のガード）
    // --------------------------------------------------
    if (selectedDate < todayStr || selectedDate > maxDateStr) {
        dateDisplay.innerText = `選択した日付: ${selectedDate} (範囲外)`;
        timetableContainer.innerHTML = "<p style='color: red; font-weight: bold;'>⚠️ 本日から30日以内の日付を選択してください。</p>";
        return;
    }

    // --- 正常な平日：Supabaseからデータ取得 ---
    dateDisplay.innerText = `選択した日付: ${selectedDate}`;
    timetableContainer.innerHTML = "<p>読み込み中...</p>";

    const { data, error } = await _supabase
        .from('reservations')
        .select('*')
        .eq('reservation_date', selectedDate);

    if (error) {
        timetableContainer.innerHTML = "エラーが発生しました。";
        return;
    }

    renderTimetable(data);
}

// ==================================================
// 🇯🇵 日本の祝日判定関数 (簡易高精度ロジック)
// ==================================================
function getJapaneseHolidayName(date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const w = date.getDay();
    const numOfWeek = Math.floor((d - 1) / 7) + 1; // 第n何曜日か

    // 固定祝日
    if (m === 1 && d === 1) return "元日";
    if (m === 2 && d === 11) return "建国記念の日";
    if (m === 2 && d === 23) return "天皇誕生日";
    if (m === 4 && d === 29) return "昭和の日";
    if (m === 5 && d === 3) return "憲法記念日";
    if (m === 5 && d === 4) return "みどりの日";
    if (m === 5 && d === 5) return "こどもの日";
    if (m === 8 && d === 11) return "山の日";
    if (m === 11 && d === 3) return "文化の日";
    if (m === 11 && d === 23) return "勤労感謝の日";

    // ハッピーマンデー (第n月曜日)
    if (w === 1) {
        if (m === 1 && numOfWeek === 2) return "成人の日";
        if (m === 7 && numOfWeek === 3) return "海の日";
        if (m === 9 && numOfWeek === 3) return "敬老の日";
        if (m === 10 && numOfWeek === 2) return "スポーツの日";
    }

    // 春分の日・秋分の日 (簡易計算)
    if (m === 3 && d === Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4))) return "春分の日";
    if (m === 9 && d === Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4))) return "秋分の日";

    // 振替休日判定 (日曜が祝日の場合、翌月曜が休み)
    if (w === 1 && d > 1) {
        const prevDate = new Date(date);
        prevDate.setDate(d - 1);
        if (getJapaneseHolidayName(prevDate)) return "振替休日";
    }

    return null; // 祝日でない
}

function renderTimetable(reservations) {
    // 05:30から22:00まで15分刻みの時間リストを作成
    const timeSlots = [];
    for (let h = 5; h <= 21; h++) {
        for (let m = 0; m < 60; m += 15) {
            if (h === 5 && m < 30) continue;
            const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            timeSlots.push(time);
        }
    }

    let html = `<table><thead><tr><th>時間</th><th>購読室 1</th><th>購読室 2</th><th>購読室 3</th></tr></thead><tbody>`;

    timeSlots.forEach(slot => {
        // スマホ表示のラベルとして data-label="時間" を追加
        html += `<tr><td data-label="時間">${slot}～</td>`;
        
        for (let room = 1; room <= 3; room++) {
            // その時間・その部屋に予約があるかチェック
            const booking = reservations.find(r => 
                r.room_number === room && 
                slot >= r.start_time && slot < r.end_time
            );
            
            const label = `購読室 ${room}`; // スマホ表示用のラベル名
            
            if (booking) {
                // 予約済みセルの生成
                html += `<td class="booked" data-label="${label}">予約済み</td>`;
            } else {
                // 空きセルの生成
                html += `<td class="free" data-label="${label}">空き</td>`;
            }
        }
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    timetableContainer.innerHTML = html;
}

document.getElementById('cancelBtn').addEventListener('click', async () => {
  const code = document.getElementById('cancelCodeInput').value.trim();
  const messageEl = document.getElementById('cancelMessage');

  if (!code || code.length !== 8) {
    messageEl.innerText = "8桁の正確な予約番号を入力してください。";
    return;
  }

  if (!confirm(`予約番号 [ ${code} ] の予約を取り消しますか？`)) {
    return;
  }

  messageEl.innerText = "処理中...";

  // 1. まず該当の予約番号が存在するか確認
  const { data: existing, error: searchError } = await _supabase
    .from('reservations')
    .select('*')
    .eq('reservation_code', code);

  if (searchError || !existing || existing.length === 0) {
    messageEl.innerText = "❌ 該当する予約番号が見つかりませんでした。";
    return;
  }

  // 2. Supabaseから行を丸ごと削除 (DELETE)
  const { error: deleteError } = await _supabase
    .from('reservations')
    .delete()
    .eq('reservation_code', code);

  if (deleteError) {
    messageEl.innerText = "❌ キャンセル処理に失敗しました。";
    console.error(deleteError);
  } else {
    messageEl.innerText = "✅ 予約の取り消しが完了しました。";
    document.getElementById('cancelCodeInput').value = '';
    // カレンダーの再読み込み関数を実行（必要に応じて）
    // updateView(datePicker.value);
  }
});