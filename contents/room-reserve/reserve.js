const SB_URL = "https://nwiufckjdgmllnusvvex.supabase.co";
const SB_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aXVmY2tqZGdtbGxudXN2dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzU1ODgsImV4cCI6MjA5MDg1MTU4OH0.RqMrRuMLL3ZC3JJgDAHvFbBiAqmAgyH0e32luy-Dhd8".trim();
const _supabase = supabase.createClient(SB_URL, SB_API_KEY);

const datePicker = document.getElementById('date-picker');
const dateDisplay = document.getElementById('selected-date-display');
const timetableContainer = document.getElementById('timetable-container');

// 初期設定：今日の日付を選択状態にする
const today = new Date().toISOString().split('T')[0];
datePicker.value = today;
updateView(today);

// 日付が変わったら表示を更新
datePicker.addEventListener('change', (e) => {
    updateView(e.target.value);
});

async function updateView(selectedDate) {
    dateDisplay.innerText = `選択した日付: ${selectedDate}`;
    timetableContainer.innerHTML = "<p>読み込み中...</p>";

    // Supabaseから特定の日付の予約だけを取得
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

function renderTimetable(reservations) {
    // （時間リスト作成部分は変更なし）
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
        // 時間の列に data-label="時間" を追加
        html += `<tr><td data-label="時間">${slot}～</td>`;
        
        for (let room = 1; room <= 3; room++) {
            const booking = reservations.find(r => 
                r.room_number === room && 
                slot >= r.start_time && slot < r.end_time
            );
            
            // 各部屋の列に data-label="購読室 X" を追加
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