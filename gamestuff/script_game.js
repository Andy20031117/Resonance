/* 按鈕連結 */
function startGame() {
  window.location.href = "character.html"; // 之後你的遊戲頁面
}

function goHome() {
window.location.href = "../resonance.html"; // 主頁連結
}

/* 首頁標題特效 */
window.onload = () => {
  document.querySelector('.game-title').style.opacity = '1';
  document.querySelector('.game-subtitle').style.opacity = '1';
};


//漂浮粒子
const canvas = document.getElementById('electric-bg');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

for (let i = 0; i < 100; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.7,
    vy: (Math.random() - 0.5) * 0.7,
    radius: Math.random() * 1.2 + 0.5
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';

  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
  });

  requestAnimationFrame(draw);
}

draw();

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});


// 爆閃粒子
window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById('explosion-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  // 畫面尺寸初始化
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 畫面大小變化時重新設定
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // 霓虹色彩
  const neonColors = ['#00ccff', '#cc00ff', '#ff8800', '#ff0044', '#ffee00'];

  // 🔹 取得沙漏容器中心
  function getSandglassCenter() {
    const sandglass = document.querySelector(".sandglass-container");
    const rect = sandglass.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + rect.height / 2 + window.scrollY
    };
  }

  // 🔹 主觸發函式：爆閃粒子發射
  function triggerExplosion() {
    const { x: centerX, y: centerY } = getSandglassCenter();
    const color = neonColors[Math.floor(Math.random() * neonColors.length)];

    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 20; // 爆閃速度更強烈

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        radius: 2 + Math.random() * 2,
        color: color
      });
    }
  }

  // 🔹 粒子更新與繪製
  function updateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 25;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    requestAnimationFrame(updateParticles);
  }

  updateParticles();

  // 開放外部呼叫（例如 HTML 裡 onclick="triggerExplosion()"）
  window.triggerExplosion = triggerExplosion;
});


