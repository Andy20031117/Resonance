document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".card");
  const startButton = document.getElementById("start-adventure");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const selectedCharacter = card.getAttribute("data-character");

      sessionStorage.setItem("selectedCharacter", selectedCharacter);

      // 移除其他卡片選取效果
      document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));

      // 高亮這張卡片
      card.classList.add("selected");

      // 顯示冒險按鈕
      startButton.classList.add("active");
    });
  });

  // 冒險開始按鈕跳轉
  startButton.addEventListener("click", () => {
    const selectedCharacter = sessionStorage.getItem("selectedCharacter");
    if (selectedCharacter) {
      window.location.href = `game.html?character=${selectedCharacter}`;
    }
  });
});

