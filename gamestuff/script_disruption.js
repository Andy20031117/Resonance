// === 觸發干擾物 Modal 開啟 ===
function openDisruptionModal() {
  const modal = document.getElementById('disruption-modal');
  if (!modal) return;

  modal.classList.remove('hidden');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden'; // 防止背景滾動
}

// === 關閉 Modal 視窗 ===
function closeDisruptionModal() {
  const modal = document.getElementById('disruption-modal');
  if (!modal) return;

  modal.classList.remove('show');
  modal.classList.add('hidden');
  document.body.style.overflow = ''; // 恢復背景滾動
}

// 可選擇加上鍵盤 ESC 關閉功能
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDisruptionModal();
});

// 可選加：hover 提示語動畫效果
const hint = document.querySelector('.alert-hint');
const alertBtn = document.querySelector('.alert-button');
if (alertBtn && hint) {
  alertBtn.addEventListener('mouseenter', () => {
    hint.style.opacity = '1';
  });
  alertBtn.addEventListener('mouseleave', () => {
    hint.style.opacity = '0';
  });
}

// 可選加：音效播放（需搭配聲音檔與 <audio> 元素）
// function playAlertSound() {
//   const audio = document.getElementById('alert-sound');
//   if (audio) audio.play();
// }
// alertBtn.addEventListener('click', playAlertSound);
