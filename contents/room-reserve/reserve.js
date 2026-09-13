// const SB_URL = "https://nwiufckjdgmllnusvvex.supabase.co";
// const SB_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aXVmY2tqZGdtbGxudXN2dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzU1ODgsImV4cCI6MjA5MDg1MTU4OH0.RqMrRuMLL3ZC3JJgDAHvFbBiAqmAgyH0e32luy-Dhd8".trim();

const SB_URL = "https://srorqnnvmjamzbjfqlfw.supabase.co";
const SB_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyb3Jxbm52bWphbXpiamZxbGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NDQ2OTgsImV4cCI6MjEwMTAyMDY5OH0._ils3YLiQE2GogCBhA5OKVjhsx427gBr1fo56Oe_nao";

const _supabase = supabase.createClient(SB_URL, SB_API_KEY);

// ==================================================
// ⚙️ 設定：デプロイしたGASのWeb API URL
// ==================================================
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyBsyXNVp3_tkee94qbGw83-1aNULuN7JMWqPwl3worK2919R-UQLv__pHBY7dSFm9V/exec";

const datePicker = document.getElementById('date-picker');
const dateDisplay = document.getElementById('selected-date-display');
const timetableContainer = document.getElementById('timetable-container');

// --- 日付制限の設定 (HTML属性の付与) ---
const todayObj = new Date();
const maxDateObj = new Date();
maxDateObj.setDate(todayObj.getDate() + 30); // 30日後

// YYYY-MM-DD 形式に変換
const todayStr = formatDate(todayObj);
const maxDateStr = formatDate(maxDateObj);

datePicker.min = todayStr;
datePicker.max = maxDateStr;

// 初期設定：今日の日付を選択状態にする
datePicker.value = todayStr;
updateView(todayStr);

// 日付が変わったら表示を更新
datePicker.addEventListener('change', (e) => {
    updateView(e.target.value);
});

// ==================================================
// メイン表示更新関数 (Supabase ＆ GAS 両対応)
// ==================================================
async function updateView(selectedDate) {
    if (!selectedDate) return;

    const dateObj = new Date(selectedDate + 'T00:00:00'); // タイムゾーンずれ防止
    const dayOfWeek = dateObj.getDay(); // 0:日曜, 6:土曜

    // --------------------------------------------------
    // 🚫 チェック①：土曜・日曜の判定
    // --------------------------------------------------
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dateDisplay.innerText = `選択した日付: ${selectedDate} (土日不可)`;
        timetableContainer.innerHTML = "<p style='color: red; font-weight: bold;'>⚠️ 土曜・日曜日は予約対象外です。平日を選択してください。</p>";
        return;
    }

    // --------------------------------------------------
    // 🚫 チェック②：日本の祝日判定
    // --------------------------------------------------
    const holidayName = getJapaneseHolidayName(dateObj);
    if (holidayName) {
        dateDisplay.innerText = `選択した日付: ${selectedDate} (${holidayName})`;
        timetableContainer.innerHTML = `<p style='color: red; font-weight: bold;'>⚠️ 祝日（${holidayName}）は予約対象外です。平日を選択してください。</p>`;
        return;
    }

    // --------------------------------------------------
    // 🚫 チェック③：30日以上先・過去の判定
    // --------------------------------------------------
    if (selectedDate < todayStr || selectedDate > maxDateStr) {
        dateDisplay.innerText = `選択した日付: ${selectedDate} (範囲外)`;
        timetableContainer.innerHTML = "<p style='color: red; font-weight: bold;'>⚠️ 本日から30日以内の日付を選択してください。</p>";
        return;
    }

    // --- 正常な平日：Supabase & GAS から並行取得 ---
    dateDisplay.innerText = `選択した日付: ${selectedDate}`;
    timetableContainer.innerHTML = "<p>読み込み中...</p>";

    try {
        const [supabaseSlots, gasSlots] = await Promise.all([
            fetchFromSupabase(selectedDate),
            fetchFromGAS(selectedDate)
        ]);

        console.log("Supabase取得結果:", supabaseSlots);
        console.log("GAS取得結果:", gasSlots);

        const combinedReservations = [...supabaseSlots, ...gasSlots];
        renderTimetable(combinedReservations);
    } catch (error) {
        console.error("データ取得エラー:", error);
        timetableContainer.innerHTML = "<p style='color: red;'>データの読み込みに失敗しました。</p>";
    }
}

// --------------------------------------------------
// 💡 時刻フォーマット正規化関数 (HH:mm:ss 形式に絶対揃える)
// 例: "6:15:00" ➔ "06:15:00"
// --------------------------------------------------
function normalizeTimeStr(timeStr) {
    if (!timeStr) return "00:00:00";
    let raw = timeStr.toString().trim();
    if (raw.includes(" ")) {
        const parts = raw.split(" ");
        raw = parts.find(p => p.includes(":")) || raw;
    }
    const parts = raw.split(':');
    let h = parseInt(parts[0], 10) || 0;
    let m = parseInt(parts[1], 10) || 0;
    let s = parts.length >= 3 ? (parseInt(parts[2], 10) || 0) : 0;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function addMinutes(timeStr, minsToAdd) {
    if (!timeStr) return "00:00:00";
    const parts = timeStr.toString().trim().split(':');
    let h = parseInt(parts[0], 10) || 0;
    let m = parseInt(parts[1], 10) || 0;

    m += minsToAdd;
    if (m >= 60) {
        h += Math.floor(m / 60);
        m = m % 60;
    } else if (m < 0) {
        h -= 1;
        m = 60 + m;
    }
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

// --------------------------------------------------
// Supabaseから取得
// --------------------------------------------------
async function fetchFromSupabase(selectedDate) {
    try {
        const { data, error } = await _supabase
            .from('reservations')
            .select('*')
            .eq('reservation_date', selectedDate);

        if (error) {
            console.warn("Supabaseエラー:", error);
            return [];
        }

        if (!data || data.length === 0) return [];

        return data
            .filter(r => r.status !== 'キャンセル済' && r.status !== '重複エラー')
            .map(r => ({
                room_number: parseInt(r.room_number, 10),
                start_time: addMinutes(r.start_time, 15), 
                end_time: addMinutes(r.end_time, 15),
                group_name: r.group_name || ""
            }));
    } catch (err) {
        console.warn("Supabase通信例外:", err);
        return [];
    }
}

// --------------------------------------------------
// 時刻フォーマット正規化関数 (すべて HH:mm に丸める)
// --------------------------------------------------
function normalizeTimeShort(timeStr) {
    if (!timeStr) return "00:00";
    let raw = timeStr.toString().trim();
    if (raw.includes(" ")) {
        const parts = raw.split(" ");
        raw = parts.find(p => p.includes(":")) || raw;
    }
    const parts = raw.split(':');
    let h = parseInt(parts[0], 10) || 0;
    let m = parseInt(parts[1], 10) || 0;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// --------------------------------------------------
// GAS（スプレッドシート）から取得
// --------------------------------------------------
async function fetchFromGAS(selectedDate) {
    try {
        const response = await fetch(`${GAS_API_URL}?date=${selectedDate}`);
        if (!response.ok) throw new Error("GAS HTTP error");

        const data = await response.json();
        const slots = data.reservedSlots || [];

        return slots.map(r => ({
            room_number: parseInt(r.room_number, 10),
            start_time: normalizeTimeShort(r.start_time),
            end_time: normalizeTimeShort(r.end_time),
            group_name: r.group_name || ""
        }));
    } catch (err) {
        console.warn("GAS通信例外:", err);
        return [];
    }
}

// --------------------------------------------------
// 🇯🇵 日本の祝日判定関数
// --------------------------------------------------
function getJapaneseHolidayName(date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const w = date.getDay();
    const numOfWeek = Math.floor((d - 1) / 7) + 1;

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

    if (w === 1) {
        if (m === 1 && numOfWeek === 2) return "成人の日";
        if (m === 7 && numOfWeek === 3) return "海の日";
        if (m === 9 && numOfWeek === 3) return "敬老の日";
        if (m === 10 && numOfWeek === 2) return "スポーツの日";
    }

    if (m === 3 && d === Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4))) return "春分の日";
    if (m === 9 && d === Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4))) return "秋分の日";

    if (w === 1 && d > 1) {
        const prevDate = new Date(date);
        prevDate.setDate(d - 1);
        if (getJapaneseHolidayName(prevDate)) return "振替休日";
    }

    return null;
}

// --------------------------------------------------
// タイムテーブル描画処理
// --------------------------------------------------
function renderTimetable(reservations) {
    const timeSlots = [];
    for (let h = 5; h <= 21; h++) {
        for (let m = 0; m < 60; m += 15) {
            if (h === 5 && m < 30) continue;
            const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
            timeSlots.push(time);
        }
    }

    let html = `<table><thead><tr><th>時間</th><th>購読室 1</th><th>購読室 2</th><th>購読室 3</th></tr></thead><tbody>`;

    timeSlots.forEach(slot => {
        const displayTime = slot.substring(0, 5);
        html += `<tr><td data-label="時間">${displayTime}～</td>`;
        
        for (let room = 1; room <= 3; room++) {
            // スロット（タイムブロック）が予約時間内に入っているか計算
            const booking = reservations.find(r => 
                r.room_number === room && 
                slot >= r.start_time && slot < r.end_time
            );
            
            const label = `購読室 ${room}`;
            
            if (booking) {
                html += `<td class="booked" data-label="${label}">予約済み</td>`;
            } else {
                html += `<td class="free" data-label="${label}">空き</td>`;
            }
        }
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    timetableContainer.innerHTML = html;
}

// --------------------------------------------------
// 💡 予約キャンセル処理 (GASにPOST送信)
// --------------------------------------------------
document.getElementById('cancelBtn').addEventListener('click', async () => {
    const codeInput = document.getElementById('cancelCodeInput');
    const code = codeInput.value.trim();
    const messageEl = document.getElementById('cancelMessage');

    if (!code || code.length !== 8) {
        messageEl.style.color = "red";
        messageEl.innerText = "8桁の正確な予約番号を入力してください。";
        return;
    }

    if (!confirm(`予約番号 [ ${code} ] の予約を取り消しますか？`)) {
        return;
    }

    messageEl.style.color = "black";
    messageEl.innerText = "処理中...";

    try {
        // GASのリダイレクト対応・CORS回避のための送信設定
        const response = await fetch(GAS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({ cancelCode: code }),
            redirect: "follow"
        });

        const resData = await response.json();

        if (resData.success) {
            messageEl.style.color = "green";
            messageEl.innerText = "✅ " + resData.message;
            codeInput.value = '';
            // 画面を再読み込みして最新状態を反映
            updateView(datePicker.value);
        } else {
            messageEl.style.color = "red";
            messageEl.innerText = "❌ " + resData.message;
        }
    } catch (error) {
        console.error("キャンセル処理エラー:", error);
        messageEl.style.color = "red";
        messageEl.innerText = "❌ 通信エラーが発生しました。もう一度お試しください。";
    }
});

function formatDate(d) {
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}