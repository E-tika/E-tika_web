// モーダル関連の要素を取得
const modal = document.getElementById("image-modal");
const img = document.getElementById("map-img");
const modalImg = document.getElementById("full-img");
const captionText = document.getElementById("modal-caption");

// 画像をクリックした時の処理
img.onclick = function(){
  modal.style.display = "block";
  modalImg.src = this.src;
  captionText.innerHTML = this.alt;
}

// 閉じるボタン（×）をクリックした時の処理
const closeBtn = document.getElementsByClassName("close-btn")[0];
closeBtn.onclick = function() { 
  modal.style.display = "none";
}

// 背景の黒い部分をクリックしても閉じれるようにする（親切設計）
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// さきほどコピーしたスプレッドシートのCSV URLをここに貼り付けます
const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDnM09BMlq-mXxfSWGslJ53SFsmCUrhg-q-gVd-AwySNl6c3Mt3M7Xf3Gq4JkHXz1HUlcA5Y1FVGrQ/pub?gid=0&single=true&output=csv';

async function loadNews() {
    try {
        const response = await fetch(spreadsheetUrl);
        const csvData = await response.text();
        
        // CSVを行ごとに分割
        const rows = csvData.split('\n');
        const newsList = document.getElementById('news-list');
        newsList.innerHTML = ''; // 「読み込み中」を消去

        // 各行をループで処理（1行目から読み込む場合）
        rows.forEach(row => {
            const columns = row.split(','); // カンマで分割
            if (columns.length >= 2) {
                const date = columns[0].trim();
                const content = columns[1].trim();

                // リストアイテムを作成
                const li = document.createElement('li');
                li.innerHTML = `<span class="news-date">${date}</span> ${content}`;
                newsList.appendChild(li);
            }
        });
    } catch (error) {
        console.error('お知らせの読み込みに失敗しました:', error);
        document.getElementById('news-list').innerHTML = '<li>お知らせの読み込みに失敗しました。</li>';
    }
}

// ページ読み込み時に実行
window.addEventListener('DOMContentLoaded', loadNews);