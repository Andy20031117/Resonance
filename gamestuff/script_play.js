const player = document.getElementById("player");
const obstacleContainer = document.getElementById("obstacle-container");
const livesEl = document.getElementById("lives");
const distanceEl = document.getElementById("distance");

/* ===== 生命 / HUD ===== */
let lives = 3;
function renderLives() {
  livesEl.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const h = document.createElement("div");
    h.className = "heart" + (i < lives ? "" : " lost");
    livesEl.appendChild(h);
  }
}
renderLives();

let distancePx = 0; // 以像素累積距離（顯示＋推動速度）
function renderDistance() {
  const d = Math.floor(distancePx / 8);
  distanceEl.textContent = String(d).padStart(6, "0");
}

/* ===== 物理：可變跳躍（長按高、短按低） =====
   往上=正；重力為負。放開時「切跳」加大重力，讓跳較矮。
*/
let isJumping = false;
let jumpHeld = false;
let vy = 0;                    // 垂直速度（正=往上）
const GRAVITY = -0.5;          // 你調整的值（滯空較久）
const JUMP_POWER = 20;         // 你調整的值（跳更高）
const CUT_MULTIPLIER = 2.5;    // 你調整的值（切跳更明顯）
let y = 0;                     // 與地面相對位移（0=貼地）
let groundY = Math.round(window.innerHeight * 0.20); // 對應 20vh（平台上緣）

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (!isJumping) {
      isJumping = true;
      jumpHeld = true;
      vy = JUMP_POWER;           // 起跳
    } else {
      jumpHeld = true;           // 空中按住不觸發雙跳
    }
  }
});
document.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    jumpHeld = false;            // 放開 → 切跳
  }
});

/* ===== 速度：距離驅動 + 上限 =====
   speed = BASE_SPEED + distancePx / SPEED_DISTANCE_UNIT
*/
const BASE_SPEED = 3.5;            // 初速（px/frame）
const SPEED_DISTANCE_UNIT = 15000;  // 每 ? px 增加 1 速（可調）
const MAX_SPEED = 30;               // 上限（覺得不夠再上調）
let speed = BASE_SPEED;

/* ===== 干擾物：三高度、三圖、像素尺寸 ===== */
const OBSTACLE_SIZE = 64;
const HEIGHT_OFFSETS = [0, 48, 96]; // 地面/中/高（相對平台上緣）
const OBSTACLE_IMAGES = ["lazybugshow.png", "castapeshow.png", "twofaceshow.png"];

/* ===== 依選角換角色貼圖（URL > sessionStorage > 預設） ===== */
(function initPlayerSprite() {
  const params = new URLSearchParams(window.location.search);
  let charName = params.get("character") || sessionStorage.getItem("selectedCharacter");
  const map = { Dunwen: "Dunwencard.png", Zirui: "ziruicard.png", Runxo: "runxocard.png" };
  player.src = map[charName] || "Dunwencard.png";
})();

/* ===== 動態間隔：緊張但公平 =====
   - 依速度把像素間距換算成時間，速度越快→同像素間距所需時間越短。
   - 使用指數分佈產生抖動感（有時很緊有時鬆），但有保底最小 ms。
   - 公平規則：連續高位不會給到過低間距；同屏障礙物數量有上限。
   - 偶爾 2 連發（有冷卻），提升刺激感。
*/
const ABS_MIN_GAP_MS   = 1500;   // 絕對不可低於的間隔（保底反應時間）
const SAFE_GAP_PX      = 450;   // 熟練玩家穩過的像素間距
const VAR_GAP_PX_BASE  = 220;   // 變動幅度基礎值（強度越高放大）
const MAX_ONSCREEN_OBS = 3;     // 同時在畫面上的障礙上限
const BURST_COOLDOWN_MS= 20000; // 2 連發冷卻 20s
const BURST_CHANCE     = 0.5;  // 2 連發機率

let nextSpawnAt = 0;            // 下一次產生時間（高精度 now）
let prevHeightTier = 0;         // 上一次障礙高度（0/1/2）
let lastBurstAt = 0;            // 上次 2 連發的時間

function intensity() {
  // 距離越大→強度從 0.8 漸升到 2.0；12萬 px 視為滿
  const t = Math.min(1, distancePx / 120000);
  return 0.8 + 1.2 * t;
}
function randExp(mean) { // 指數亂數：-mean * ln(1-u)
  const u = Math.random();
  return -mean * Math.log(1 - u);
}
function sampleGapPx() {
  const k = intensity();
  const varPx = VAR_GAP_PX_BASE * k;
  let gapPx = SAFE_GAP_PX + randExp(varPx);

  // 公平：若上次是高位，避免下一顆間距過小
  if (prevHeightTier === 2 && gapPx < SAFE_GAP_PX + varPx * 0.25) {
    gapPx += varPx * 0.35;
  }
  return gapPx;
}
function gapPxToMs(gapPx) {
  const pxPerSec = speed * 60;      // 估 60fps：每秒位移像素
  const sec = gapPx / Math.max(1, pxPerSec);
  return Math.max(ABS_MIN_GAP_MS, sec * 1000);
}

/* ===== 產生障礙物（支援指定高度集合；回傳實際高度 tier） ===== */
function spawnObstacle(allowedTiers) {
  const tiers = Array.isArray(allowedTiers) && allowedTiers.length ? allowedTiers : [0,1,2];

  const imgSrc = OBSTACLE_IMAGES[Math.floor(Math.random() * OBSTACLE_IMAGES.length)];
  const tier = tiers[Math.floor(Math.random() * tiers.length)];
  const dy = HEIGHT_OFFSETS[tier];

  const obs = document.createElement("div");
  obs.className = "obstacle";
  obs.style.position = "absolute";
  obs.style.left = `${window.innerWidth - (OBSTACLE_SIZE + 16)}px`; // 右緣內 16px
  obs.style.bottom = `${groundY + dy}px`;

  const img = document.createElement("img");
  img.src = imgSrc;
  img.alt = "干擾物";
  img.width = OBSTACLE_SIZE;
  img.height = OBSTACLE_SIZE;

  obs.appendChild(img);
  obstacleContainer.appendChild(obs);

  prevHeightTier = tier;
  return tier;
}

/* ===== 主迴圈 ===== */
function gameLoop(now) {
  /* 1) 距離驅動速度（含上限） */
  speed = Math.min(MAX_SPEED, BASE_SPEED + distancePx / 20000);

  /* 2) 物理更新（可變跳躍） */
  if (isJumping) {
    if (!jumpHeld && vy > 0) {
      vy += GRAVITY * CUT_MULTIPLIER; // 切跳：更快進入下降
    } else {
      vy += GRAVITY;
    }
    y += vy;

    if (y <= 0) { // 落地
      y = 0;
      vy = 0;
      isJumping = false;
    }
  }
  player.style.bottom = `${groundY + y}px`;

  /* 3) 干擾物移動 & 碰撞 */
  document.querySelectorAll(".obstacle").forEach((obs) => {
    const leftPx = parseFloat(obs.style.left);
    obs.style.left = `${leftPx - speed}px`;

    const pr = player.getBoundingClientRect();
    const or = obs.getBoundingClientRect();
    const collide = !(pr.right < or.left || pr.left > or.right || pr.bottom < or.top || pr.top > or.bottom);
    if (collide) {
      lives = Math.max(0, lives - 1);
      renderLives();
      obs.remove();
      if (lives <= 0) {
        alert("Game Over");
        window.location.reload();
        return;
      }
    }
    if (leftPx < -(OBSTACLE_SIZE + 40)) obs.remove(); // 出畫面移除
  });

  /* 4) 動態排程生成：間隔依速度與強度抽樣，帶公平約束 */
  if (nextSpawnAt === 0) {
    const gpx = sampleGapPx();
    nextSpawnAt = now + gapPxToMs(gpx);
  } else if (now >= nextSpawnAt) {
    if (document.querySelectorAll(".obstacle").length < MAX_ONSCREEN_OBS) {
      const canBurst = (now - lastBurstAt) > BURST_COOLDOWN_MS && Math.random() < BURST_CHANCE;

      if (canBurst) {
        const tier1 = spawnObstacle(); // 第一顆
        const miniGapPx = Math.max(160, SAFE_GAP_PX * 0.45); // 連發時更緊
        const miniDelay = gapPxToMs(miniGapPx);
        nextSpawnAt = now + miniDelay;

        setTimeout(() => {
          // 第二顆盡量避免連續高位
          const tier2 = spawnObstacle((tier1 === 2) ? [0,1] : [0,1,2]);
        }, miniDelay * 0.5);

        lastBurstAt = now;
      } else {
        spawnObstacle(); // 一般單發
        const gpx = sampleGapPx();
        nextSpawnAt = now + gapPxToMs(gpx);
      }
    } else {
      // 場上太多：延後下一次（避免炸場）
      nextSpawnAt = now + 200;
    }
  }

  /* 5) 距離累加 & 顯示 */
  distancePx += speed;
  renderDistance();

  requestAnimationFrame(gameLoop);
}

/* ===== 視窗縮放：同步平台上緣與既有障礙物 ===== */
window.addEventListener("resize", () => {
  const oldGround = groundY;
  groundY = Math.round(window.innerHeight * 0.20); // 20vh

  // 玩家
  player.style.bottom = `${groundY + y}px`;

  // 既有障礙物維持相對平台高度
  document.querySelectorAll(".obstacle").forEach((obs) => {
    const currentBottom = parseFloat(obs.style.bottom); // 舊：oldGround + (0/48/96)
    const dy = currentBottom - oldGround;
    obs.style.bottom = `${groundY + dy}px`;
  });
});

/* ===== 啟動 ===== */
window.onload = () => requestAnimationFrame(gameLoop);
