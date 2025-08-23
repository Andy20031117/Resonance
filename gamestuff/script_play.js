const player = document.getElementById("player");
const obstacleContainer = document.getElementById("obstacle-container");

/* ========= 物理參數（提升跳躍高度＆稍微更久的滯空） =========
   往上 = 正值；重力為負值。適中手感參考：
   - JUMP_POWER：14 -> 18（跳更高）
   - GRAVITY：-0.8 -> -0.95（墜落更慢一點，滯空久一點）
*/
let isJumping = false;
let vy = 0;                 // 垂直速度（正=往上）
const GRAVITY = -0.6;      // 重力向下（負）
const JUMP_POWER = 21;      // 起跳速度（正）
let y = 0;                  // 與地面相對位移（0=貼地）
let groundY = Math.round(window.innerHeight * 0.20); // 20vh（平台上緣）

/* ========= 遊戲參數 ========= */
let speed = 4;              // px/frame
let timeMs = 0;
let lives = 3;

/* ========= 依選角自動換貼圖（URL 參數 > sessionStorage > 預設） ========= */
(function initPlayerSprite() {
  const params = new URLSearchParams(window.location.search);
  let charName = params.get("character");

  if (!charName) charName = sessionStorage.getItem("selectedCharacter");

  // 映射：大小寫照你檔名修正（你給的卡片檔：Dunwencard.png, ziruicard.png, runxocard.png）
  const map = {
    Dunwen: "Dunwencard.png",
    Zirui:  "ziruicard.png",
    Runxo:  "runxocard.png"
  };

  // 預設 fallback（沒有選的話，顯示盾穩）
  const sprite = map[charName] || "Dunwencard.png";
  player.src = sprite;
})();

/* ========= 跳躍控制 ========= */
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !isJumping) {
    isJumping = true;
    vy = JUMP_POWER;        // 起跳：往上為正
  }
});

/* ========= 主迴圈 ========= */
function gameLoop() {
  // 物理：跳躍/落地
  if (isJumping) {
    vy += GRAVITY;  // 向下加速度
    y  += vy;       // 累加位移

    if (y <= 0) {   // 落地歸零
      y = 0;
      vy = 0;
      isJumping = false;
    }
  }

  // 每幀都把角色 bottom 設為：平台上緣 + 位移
  player.style.bottom = `${groundY + y}px`;

  // 障礙物移動 & 碰撞
  document.querySelectorAll(".obstacle").forEach((obs) => {
    const leftPx = parseFloat(obs.style.left);
    obs.style.left = `${leftPx - speed}px`;

    // 簡易 AABB + 距地高度判斷
    const playerLeft = 8 * window.innerWidth / 100; // 8vw 大約位置
    const playerRight = playerLeft + player.getBoundingClientRect().width;
    const obsRight = leftPx + obs.getBoundingClientRect().width;

    // 當障礙物進入玩家的水平區域，且玩家高度不足（y < 70）視為撞擊
    if (obsRight > playerLeft && leftPx < playerRight && y < 70) {
      lives--;
      obs.remove();
      if (lives <= 0) {
        alert("Game Over");
        window.location.reload();
      }
    }

    // 出畫面左側移除
    if (leftPx < -100) obs.remove();
  });

  // 產生障礙物（頻率會隨速度加快而變高）
  if (timeMs % Math.floor(2000 / speed) === 0) spawnObstacle();

  // 每 10 秒加速
  if (timeMs % 10000 === 0) speed += 0.5;

  timeMs += 16;
  requestAnimationFrame(gameLoop);
}

/* ========= 三種干擾物：隨機生成 =========
   你先前 modal 的圖檔：lazybugshow.png、castapeshow.png、twofaceshow.png
   這裡直接沿用（同層資料夾）
*/
function spawnObstacle() {
  const choices = ["lazybugshow.png", "castapeshow.png", "twofaceshow.png"];
  const src = choices[Math.floor(Math.random() * choices.length)];

  const obs = document.createElement("div");
  obs.className = "obstacle";
  obs.style.left = `${window.innerWidth - 80}px`; // 右緣內 80px，馬上看得到
  obs.style.bottom = `${groundY}px`;              // 貼平台上緣

  const img = document.createElement("img");
  img.src = src;
  img.alt = "干擾物";
  obs.appendChild(img);

  obstacleContainer.appendChild(obs);
}

/* ========= 視窗縮放時，更新基準高度 ========= */
window.addEventListener("resize", () => {
  groundY = Math.round(window.innerHeight * 0.20);   // 對齊 20vh
  player.style.bottom = `${groundY + y}px`;
  document.querySelectorAll(".obstacle").forEach((obs) => {
    obs.style.bottom = `${groundY}px`;
  });
});

/* 啟動 */
window.onload = () => requestAnimationFrame(gameLoop);
