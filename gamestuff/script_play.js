// === DOM & HUD ===
const game = document.getElementById("game");
const player = document.getElementById("player");
const obstacleContainer = document.getElementById("obstacle-container");
const fragmentContainer = document.getElementById("fragment-container");
const livesEl = document.getElementById("lives");
const distanceEl = document.getElementById("distance");
const fragsEl = document.getElementById("frags");
const skillPill = document.getElementById("skill-pill");

// === 角色選擇 & 貼圖 ===
let selectedChar =
  new URLSearchParams(location.search).get("character") ||
  sessionStorage.getItem("selectedCharacter") ||
  "Dunwen";
const CHAR_SPRITE = {
  Dunwen: "Dunwencard.png",
  Zirui: "ziruicard.png",
  Runxo: "runxocard.png",
};
player.src = CHAR_SPRITE[selectedChar] || "Dunwencard.png";

// === 生命值 HUD ===
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

// === 距離 HUD ===
let distancePx = 0;
function renderDistance() {
  const d = Math.floor(distancePx / 8);
  distanceEl.textContent = String(d).padStart(6, "0");
}
renderDistance();

// === 平台：以「平台上緣」為基準 ===
const PLATFORM_BOTTOM_VH = 10; // 平台底 10vh
const PLATFORM_HEIGHT_VH = 10; // 平台高 10vh
let groundBottom = Math.round(window.innerHeight * (PLATFORM_BOTTOM_VH / 100));
let groundTop = Math.round(
  window.innerHeight * ((PLATFORM_BOTTOM_VH + PLATFORM_HEIGHT_VH) / 100)
); // ★平台上緣

// === 跳躍（可變） ===
let y = 0; // 相對平台上緣的位移
let vy = 0;
let isJumping = false;
let jumpHeld = false;
const GRAVITY = -0.5;
const JUMP_POWER = 20;
const CUT_MULTIPLIER = 2.5;

// === 速度：距離驅動 + 上限 ===
const BASE_SPEED = 3.5;
const SPEED_DISTANCE_UNIT = 10000; // 每 10,000px +1 速（註解原文寫20,000；此處採用10,000）
const MAX_SPEED = 50;
let speed = BASE_SPEED;

// === 障礙/碎片 基本設定 ===
const OBSTACLE_SIZE = 64;
const HEIGHT_OFFSETS = [0, 50, 100]; // 相對平台上緣三段
const OBSTACLE_IMAGES = ["lazybugshow.png", "castapeshow.png", "twofaceshow.png"];

// Logo 碎片
const FRAG_TYPES = ["A", "B", "C", "D", "E", "F"];
const FRAG_IMG = {
  A: "logo_A.png",
  B: "logo_B.png",
  C: "logo_C.png",
  D: "logo_D.png",
  E: "logo_E.png",
  F: "logo_F.png",
};
let collected = new Set();
function renderFragHUD() {
  fragsEl.querySelectorAll(".frag-slot").forEach((slot) => {
    const id = slot.dataset.frag;
    slot.classList.toggle("filled", collected.has(id));
  });
}
renderFragHUD();

// === 技能（E 鍵） ===
// Dunwen: 無敵 5s，自動保命，CD 15s
// Zirui : 磁吸+減速 3s，CD 10s
// Runxo : 瞬移 + 0.6s 虛化，CD 10s
const skillCfg = {
  Dunwen: { dur: 5000, cd: 15000 },
  Zirui: { dur: 3000, cd: 10000 },
  Runxo: { dur: 600, cd: 10000 },
};
let skillActiveUntil = 0;
let skillCdUntil = 0;
let invincibleUntil = 0;

// Zirui：磁吸參數
const MAGNET_RADIUS = 280;
const MAGNET_STRENGTH = 8;

// === 動態障礙間隔 ===
const ABS_MIN_GAP_MS = 950;
const SAFE_GAP_PX = 420;
const VAR_GAP_PX_BASE = 150;
const MAX_ONSCREEN_OBS = 3;
const BURST_COOLDOWN_MS = 20000;
const BURST_CHANCE = 0.4;
// ★ 同屏障礙的彼此「水平最小間隔」
const MIN_SEP_BETWEEN_OBS_PX = 320; // 300~420 越大越安全

// 保底規則（避免幾乎不可能的窄間隔）
let lastWasHigh = false; // 記錄上一顆是否高位（tier=2）
const FAIR_MIN_GAP_PX = 380;        // 全域最小像素間距保底
const MIN_GAP_AFTER_HIGH_PX = 480;  // 高位之後的保底

let nextSpawnAt = 0;
let prevHeightTier = 0;
let lastBurstAt = 0;

// === 碎片排程（與障礙錯峰） ===
let nextFragAt = performance.now() + 1500;

// === FX / HUD 輔助 ===
function isSkillActive() {
  return performance.now() < skillActiveUntil;
}
function speedScale() {
  return selectedChar === "Zirui" && isSkillActive() ? 0.85 : 1.0;
}
function setWorldSlowFX(on) {
  game.classList.toggle("slow-world", !!on);
}
function setPlayerInvFX(on) {
  player.classList.toggle("invincible", !!on);
}
function setPlayerMagnetFX(on) {
  player.classList.toggle("magnet", !!on);
}
function updateSkillPill() {
  const now = performance.now();
  if (now >= skillCdUntil) {
    skillPill.textContent = "E ▸ READY";
    skillPill.classList.add("ready");
  } else {
    skillPill.textContent = `E ▸ ${Math.ceil((skillCdUntil - now) / 1000)}s`;
    skillPill.classList.remove("ready");
  }
}
updateSkillPill();
function isInvincible() {
  return performance.now() < invincibleUntil;
}

// === 遊戲狀態 / 計分 & 跳 result.html ===
let gameStartAt = performance.now();
let isGameOver = false;
let loopId = 0;
let lastCollisionReason = "";

// 你可以自訂分數公式：預設 距離分 + 碎片分
function calcScore() {
  const distScore = Math.floor(distancePx / 8); // 與 HUD 顯示一致
  const fragScore = collected.size * 100;       // 每片 100 分
  return distScore + fragScore;
}



  // 遊戲結束
function onGameOver(causeText) {
  if (isGameOver) return;
  isGameOver = true;
  if (loopId) cancelAnimationFrame(loopId);

  // 準備結果資料
  const elapsedSec = Math.max(0, (performance.now() - gameStartAt) / 1000);
  const payload = {
    character: selectedChar,                 // 讓橋接模組轉成中文名
    score: calcScore(),
    timeSurvived: elapsedSec,                // 秒
    distance: Math.floor(distancePx / 8),    // 你的 HUD「距離」單位
    logoPiecesRun: collected.size,           // 本局拿到的碎片數
    logoPiecesTotal: FRAG_TYPES.length       // 碎片總數（此處為 6）
  };

  commitRunToResultPage(payload);            // ✔ 寫入並跳轉 result.html
}


// === 輸入 ===
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (!isJumping) {
      isJumping = true;
      jumpHeld = true;
      vy = JUMP_POWER;
    } else {
      jumpHeld = true;
    }
  } else if (e.code === "KeyE") {
    triggerSkill();
  } else if (e.code.toLowerCase() === "r") {
    // 方便測試：按 R 直接結束
    onGameOver("手動測試結束");
  }
});
document.addEventListener("keyup", (e) => {
  if (e.code === "Space") jumpHeld = false;
});

// === 技能觸發 ===
function triggerSkill() {
  const now = performance.now();
  if (now < skillCdUntil) return;

  if (selectedChar === "Dunwen") {
    invincibleUntil = now + skillCfg.Dunwen.dur;
    skillActiveUntil = invincibleUntil;
    skillCdUntil = now + skillCfg.Dunwen.cd;
    setPlayerInvFX(true);
  } else if (selectedChar === "Zirui") {
    skillActiveUntil = now + skillCfg.Zirui.dur;
    skillCdUntil = now + skillCfg.Zirui.cd;
    setWorldSlowFX(true);
    setPlayerMagnetFX(true);
  } else if (selectedChar === "Runxo") {
    const safeTier = pickSafeTierNow();
    teleportToTier(safeTier);
    invincibleUntil = now + skillCfg.Runxo.dur;
    skillActiveUntil = invincibleUntil;
    skillCdUntil = now + skillCfg.Runxo.cd;
    setPlayerInvFX(true);
  }
  updateSkillPill();
}

// === 物理 ===
function physicsStep() {
  if (isJumping) {
    if (!jumpHeld && vy > 0) vy += GRAVITY * CUT_MULTIPLIER;
    else vy += GRAVITY;
    y += vy;
    if (y <= 0) {
      y = 0;
      vy = 0;
      isJumping = false;
    }
  }
  player.style.bottom = `${groundTop + y}px`;
}

// === 速度 & 距離 ===
function updateSpeedAndDistance() {
  speed = Math.min(MAX_SPEED, BASE_SPEED + distancePx / SPEED_DISTANCE_UNIT);
  const scaled = speed * speedScale();
  distancePx += scaled;
  renderDistance();
}

// === 間隔工具 ===
function intensity() {
  const t = Math.min(1, distancePx / 120000);
  return 0.8 + 1.2 * t;
}
function randExp(mean) {
  const u = Math.random();
  return -mean * Math.log(1 - u);
}
function sampleGapPx() {
  const k = intensity();
  const varPx = VAR_GAP_PX_BASE * k;
  let gapPx = SAFE_GAP_PX + randExp(varPx);
  if (prevHeightTier === 2 && gapPx < SAFE_GAP_PX + varPx * 0.25) gapPx += varPx * 0.35;
  return gapPx;
}
function gapPxToMs(gapPx) {
  const pxPerSec = speed * speedScale() * 60;
  const sec = gapPx / Math.max(1, pxPerSec);
  return Math.max(ABS_MIN_GAP_MS, sec * 1000);
}

// === 生成：障礙 & 碎片 ===
function spawnObstacle(allowedTiers) {
  const tiers =
    Array.isArray(allowedTiers) && allowedTiers.length ? allowedTiers : [0, 1, 2];
  const imgSrc = OBSTACLE_IMAGES[Math.floor(Math.random() * OBSTACLE_IMAGES.length)];
  const tier = tiers[Math.floor(Math.random() * tiers.length)];
  const dy = HEIGHT_OFFSETS[tier];

  const obs = document.createElement("div");
  obs.className = "obstacle";
  obs.style.left = `${window.innerWidth - (OBSTACLE_SIZE + 16)}px`;
  obs.style.bottom = `${groundTop + dy}px`;

  const img = document.createElement("img");
  img.src = imgSrc;
  img.alt = "干擾物";
  img.width = OBSTACLE_SIZE;
  img.height = OBSTACLE_SIZE;

  obs.appendChild(img);
  obstacleContainer.appendChild(obs);

  prevHeightTier = tier;
  lastWasHigh = (tier === 2);
  return tier;
}
function spawnFragment() {
  const remaining = FRAG_TYPES.filter((t) => !collected.has(t));
  if (!remaining.length) return;
  const type = remaining[Math.floor(Math.random() * remaining.length)];

  const tierChoices = prevHeightTier === 2 ? [0, 1] : [0, 1, 2];
  const tier = tierChoices[Math.floor(Math.random() * tierChoices.length)];
  const dy = HEIGHT_OFFSETS[tier];

  const frag = document.createElement("div");
  frag.className = "fragment";
  frag.dataset.type = type;
  frag.style.left = `${window.innerWidth - (42 + 24)}px`;
  frag.style.bottom = `${groundTop + dy + 10}px`;

  const img = document.createElement("img");
  img.src = FRAG_IMG[type];
  img.alt = `碎片 ${type}`;
  frag.appendChild(img);

  fragmentContainer.appendChild(frag);
}

// === 物件移動 & 碰撞 ===
function stepObstaclesAndCollisions() {
  const scaled = speed * speedScale();
  const playerRect = player.getBoundingClientRect();

  // 障礙
  document.querySelectorAll(".obstacle").forEach((obs) => {
    const leftPx = parseFloat(obs.style.left);
    obs.style.left = `${leftPx - scaled}px`;

    const or = obs.getBoundingClientRect();
    const collide = !(
      playerRect.right < or.left ||
      playerRect.left > or.right ||
      playerRect.bottom < or.top ||
      playerRect.top > or.bottom
    );
    if (collide) {
      if (!isInvincible()) {
        const now = performance.now();
        if (selectedChar === "Dunwen" && now >= skillCdUntil) {
          // 自動保命
          invincibleUntil = now + skillCfg.Dunwen.dur;
          skillActiveUntil = invincibleUntil;
          skillCdUntil = now + skillCfg.Dunwen.cd;
          setPlayerInvFX(true);
        } else {
          lives = Math.max(0, lives - 1);
          renderLives();
          lastCollisionReason = "碰撞干擾物";
          if (lives <= 0) {
            onGameOver(lastCollisionReason); // ★ 跳結果頁
            return;
          }
        }
      }
      obs.remove();
    }
    if (leftPx < -(OBSTACLE_SIZE + 40)) obs.remove();
  });

  // 碎片
  document.querySelectorAll(".fragment").forEach((frag) => {
    const leftPx = parseFloat(frag.style.left);
    let bottomPx = parseFloat(frag.style.bottom);

    // 磁吸
    if (selectedChar === "Zirui" && isSkillActive()) {
      const pr = player.getBoundingClientRect();
      const playerCx = pr.left + pr.width / 2;
      const playerCy = pr.top + pr.height / 2;

      const fr = frag.getBoundingClientRect();
      const fragCx = fr.left + fr.width / 2;
      const fragCy = fr.top + fr.height / 2;

      const dx = playerCx - fragCx;
      const dy = playerCy - fragCy;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < MAGNET_RADIUS) {
        const pull = MAGNET_STRENGTH * (1 - dist / MAGNET_RADIUS);
        frag.style.left = `${leftPx + (dx / dist) * pull}px`;
        frag.style.bottom = `${bottomPx + (-(dy) / dist) * pull}px`;
      }
    }

    // 自身移動（略慢於障礙）
    frag.style.left = `${parseFloat(frag.style.left) - scaled * 0.9}px`;

    // 收集
    const fr = frag.getBoundingClientRect();
    const hit = !(
      playerRect.right < fr.left ||
      playerRect.left > fr.right ||
      playerRect.bottom < fr.top ||
      playerRect.top > fr.bottom
    );
    if (hit) {
      const type = frag.dataset.type;
      collected.add(type);
      renderFragHUD();
      frag.remove();
      if (collected.size === FRAG_TYPES.length) {
        // 你可以在這裡另觸發特殊事件或加分
        // console.log("Logo 完成！");
      }
    }
    if (parseFloat(frag.style.left) < -100) frag.remove();
  });
}

// === 生成排程（動態障礙 + 錯峰碎片） ===
function clampedGapPx(rawPx) {
  const needMin = lastWasHigh ? Math.max(FAIR_MIN_GAP_PX, MIN_GAP_AFTER_HIGH_PX)
                              : FAIR_MIN_GAP_PX;
  return Math.max(needMin, rawPx);
}

// 右側生成點（新障礙的 left 值）
function spawnLeftX() {
  return window.innerWidth - (OBSTACLE_SIZE + 16);
}

// 目前畫面中「最靠右」的障礙 right（視窗座標）
function rightmostObstacleRight() {
  let maxRight = -Infinity;
  document.querySelectorAll(".obstacle").forEach((obs) => {
    const r = obs.getBoundingClientRect();
    if (r.right > maxRight) maxRight = r.right;
  });
  return maxRight; // 若沒有障礙，會是 -Infinity
}

function scheduleSpawns(now) {
  // 障礙
  if (nextSpawnAt === 0) {
    nextSpawnAt = now + gapPxToMs(sampleGapPx());
  } else if (now >= nextSpawnAt) {
    if (document.querySelectorAll(".obstacle").length < MAX_ONSCREEN_OBS) {

      // ★ 水平間隔保底
      const needSep = MIN_SEP_BETWEEN_OBS_PX;
      const sep = spawnLeftX() - rightmostObstacleRight();
      if (sep < needSep) {
        nextSpawnAt = now + gapPxToMs(needSep - Math.max(0, sep));
        return;
      }

      const canBurst =
        now - lastBurstAt > BURST_COOLDOWN_MS && Math.random() < BURST_CHANCE;
      if (canBurst) {
        const tier1 = spawnObstacle();

        // 二連發也要保底：把「迷你間隔」設為更寬
        const miniGapPx = Math.max(SAFE_GAP_PX * 0.8, MIN_SEP_BETWEEN_OBS_PX * 1.1);
        const miniDelay = gapPxToMs(miniGapPx);

        nextSpawnAt = now + miniDelay;
        setTimeout(() => {
          // 第二顆盡量避免高位接高位
          spawnObstacle(tier1 === 2 ? [0, 1] : [0, 1, 2]);
        }, miniDelay * 0.5);
        lastBurstAt = now;
      } else {
        spawnObstacle();
        nextSpawnAt = now + gapPxToMs(sampleGapPx());
      }
    } else {
      nextSpawnAt = now + 200;
    }
  }

  // 碎片（放慢 5.4–9s；磁吸期間不排）
  if (collected.size < FRAG_TYPES.length && now >= nextFragAt) {
    if (!(selectedChar === "Zirui" && isSkillActive())) {
      spawnFragment();
    }
    const base = 5400 + Math.random() * 3600; // 5.4–9s
    nextFragAt = now + base / speedScale();
  }
}

// === Runxo：挑安全層 & 瞬移 ===
function pickSafeTierNow() {
  const pr = player.getBoundingClientRect();
  const playerH = pr.height;
  const candidates = [0, 1, 2];

  // 先找當下立刻安全的層
  let safeList = [];
  for (const tier of candidates) {
    const targetBottom = groundTop + HEIGHT_OFFSETS[tier] + 10;
    const testTop = window.innerHeight - targetBottom - playerH;
    const testBottom = window.innerHeight - targetBottom;

    let overlap = false;
    document.querySelectorAll(".obstacle").forEach((obs) => {
      const or = obs.getBoundingClientRect();
      const rectOverlap = !(
        pr.right < or.left ||
        pr.left > or.right ||
        testBottom < or.top ||
        testTop > or.bottom
      );
      if (rectOverlap) overlap = true;
    });
    if (!overlap) safeList.push(tier);
  }
  if (safeList.length) {
    return safeList[Math.floor(Math.random() * safeList.length)];
  }

  // 都不安全：選與最近障礙的最遠垂直距離
  let bestTier = 0,
    bestScore = -Infinity;
  for (const tier of candidates) {
    const targetBottom = groundTop + HEIGHT_OFFSETS[tier] + 10;
    const tgtTop = window.innerHeight - targetBottom - playerH;
    const tgtBottom = window.innerHeight - targetBottom;

    let minVDist = Infinity;
    document.querySelectorAll(".obstacle").forEach((obs) => {
      const or = obs.getBoundingClientRect();
      const vOverlap = !(tgtBottom < or.top || tgtTop > or.bottom);
      if (vOverlap) {
        minVDist = Math.min(minVDist, 0);
      } else {
        const dist = Math.min(
          Math.abs(or.top - tgtBottom),
          Math.abs(tgtTop - or.bottom)
        );
        minVDist = Math.min(minVDist, dist);
      }
    });

    const score = minVDist === Infinity ? 1e9 : minVDist;
    if (score > bestScore) {
      bestScore = score;
      bestTier = tier;
    }
  }
  return bestTier;
}
function teleportToTier(tier) {
  y = HEIGHT_OFFSETS[tier];
  player.style.bottom = `${groundTop + y}px`;
}

// === 視窗縮放 ===
window.addEventListener("resize", () => {
  const oldTop = groundTop;
  groundBottom = Math.round(window.innerHeight * (PLATFORM_BOTTOM_VH / 100));
  groundTop = Math.round(
    window.innerHeight * ((PLATFORM_BOTTOM_VH + PLATFORM_HEIGHT_VH) / 100)
  );

  player.style.bottom = `${groundTop + y}px`;

  document.querySelectorAll(".obstacle").forEach((obs) => {
    const currentBottom = parseFloat(obs.style.bottom);
    obs.style.bottom = `${groundTop + (currentBottom - oldTop)}px`;
  });
  document.querySelectorAll(".fragment").forEach((frag) => {
    const currentBottom = parseFloat(frag.style.bottom);
    frag.style.bottom = `${groundTop + (currentBottom - oldTop)}px`;
  });
});

// === 軟重開（不 reload） ===
function resetGame() {
  obstacleContainer.innerHTML = "";
  fragmentContainer.innerHTML = "";

  lives = 3;
  renderLives();
  distancePx = 0;
  renderDistance();
  collected.clear();
  renderFragHUD();

  speed = BASE_SPEED;
  y = 0;
  vy = 0;
  isJumping = false;
  jumpHeld = false;

  skillActiveUntil = 0;
  skillCdUntil = 0;
  invincibleUntil = 0;
  setPlayerInvFX(false);
  setPlayerMagnetFX(false);
  setWorldSlowFX(false);
  updateSkillPill();

  nextSpawnAt = 0;
  lastBurstAt = 0;
  nextFragAt = performance.now() + 2000;

  player.style.bottom = `${groundTop + y}px`;

  // 重新計時（只在你選擇同頁重玩時會用到）
  gameStartAt = performance.now();
}

// === 主迴圈 ===
function gameLoop(now) {
  if (isGameOver) return;

  updateSpeedAndDistance();
  physicsStep();
  stepObstaclesAndCollisions();
  scheduleSpawns(now);

  const t = performance.now();
  if (t >= invincibleUntil) setPlayerInvFX(false);
  if (!(selectedChar === "Zirui" && t < skillActiveUntil)) {
    setWorldSlowFX(false);
    setPlayerMagnetFX(false);
  }
  updateSkillPill();

  loopId = requestAnimationFrame(gameLoop);
}


/* ============================================================
   ▶ 結束資料橋接（play.js → result.html）
   - 寫入 localStorage.gameResult（result.js 會讀）
   - 更新 localStorage.leaderboard（不儲存玩家名稱）
   - 維護碎片累計完成度
============================================================ */
(function(){
  const RESULT_KEY      = "gameResult";
  const LEADERBOARD_KEY = "leaderboard";
  const LOGO_CUM_KEY    = "logoPiecesCumulative"; // 跨局累計的碎片數
  const LOGO_TOTAL_KEY  = "logoPiecesTotal";      // 碎片總數

  // 與 result.js 一致的評級邏輯
  function computeGrade(score){
    return score>=15000 ? "S" :
           score>=12000 ? "A" :
           score>= 9000 ? "B" :
           score>= 6000 ? "C" : "D";
  }

  // （可選）把內部角色代號 → 中文展示名
  const CHAR_NAME_MAP = { Dunwen:"盾穩", Zirui:"磁芮", Runxo:"亂序" };

  function resolveResultURL(file="result.html"){
    try { return new URL(file, location.href).toString(); } catch { return file; }
  }

  // 對外：在 Game Over 時呼叫這個
  window.commitRunToResultPage = function(payload){
    // ---- 1) 欄位清理 ----
    const rawChar     = payload.character ?? "—";
    const character   = CHAR_NAME_MAP[rawChar] || rawChar; // 轉中文名（若對應不到就用原值）
    const score       = Math.max(0, Math.round(payload.score || 0));
    const timeSurvived= Number(payload.timeSurvived || 0); // 秒
    const distance    = (payload.distance!=null) ? Math.round(payload.distance) : null;
    const piecesRun   = Math.max(0, Math.round(payload.logoPiecesRun || 0));
    const piecesTotal = Math.max(1, Math.round(payload.logoPiecesTotal || Number(localStorage.getItem(LOGO_TOTAL_KEY)) || 12));

    // ---- 2) 碎片跨局累積完成度 ----
    const prevCum = Number(localStorage.getItem(LOGO_CUM_KEY) || 0);
    const newCum  = Math.min(piecesTotal, prevCum + piecesRun);
    localStorage.setItem(LOGO_CUM_KEY, String(newCum));
    localStorage.setItem(LOGO_TOTAL_KEY, String(piecesTotal));
    const logoCompletionCumulative = Math.round((newCum / piecesTotal) * 100);

    // ---- 3) 更新排行榜（不存玩家名稱）----
    let board = [];
    try { board = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]"); } catch {}
    const entry = { score, time: timeSurvived, date: new Date().toISOString().slice(0,10) };
    board.push(entry);

    const sorted = board.slice().sort((a,b)=> b.score - a.score || b.time - a.time);
    const rank = sorted.findIndex(r => r === entry) + 1;

    // 個人最佳（以本機過往最高分判斷）
    const prevBest = board.slice(0, -1).reduce((m,r)=> Math.max(m, r.score), 0);
    const isPersonalBest = score >= prevBest;

    // 限制排行榜長度
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board.slice(-100)));

    // ---- 4) 組結果物件，供 result.js 使用 ----
    const resultObj = {
      character,
      score,
      grade: computeGrade(score),
      timeSurvived,
      distance,
      logoPiecesRun: piecesRun,
      logoPiecesTotal: piecesTotal,
      logoCompletionCumulative,
      leaderboard: sorted.slice(0,5),
      rank,
      isPersonalBest
    };
    try { localStorage.setItem(RESULT_KEY, JSON.stringify(resultObj)); } catch {}

    // ---- 5) 跳結果頁 ----
    location.href = resolveResultURL("result.html");
  };
})();


// === 啟動 ===
window.onload = () => {
  gameStartAt = performance.now();
  loopId = requestAnimationFrame(gameLoop);
};
