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