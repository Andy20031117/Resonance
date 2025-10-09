console.log("script_game.js loaded!");

/* 按鈕連結 */
function startGame() {
  window.location.href = "character.html"; // 之後你的遊戲頁面
}

function goHome() {
window.location.href = "index.html"; // 主頁連結
}

/* 首頁標題特效 */
window.onload = () => {
  document.querySelector('.game-title').style.opacity = '1';
  document.querySelector('.game-subtitle').style.opacity = '1';
};


window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded!");

  // ✅ 這段如果 electric-bg canvas 不存在會噴錯
  const canvas = document.getElementById('electric-bg');
  if (canvas) {
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
  }

  // ✅ 以下是你原本的爆閃粒子
  const explosionCanvas = document.getElementById('explosion-canvas');
  const ctx = explosionCanvas.getContext('2d');
  let particles = [];

  explosionCanvas.width = window.innerWidth;
  explosionCanvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    explosionCanvas.width = window.innerWidth;
    explosionCanvas.height = window.innerHeight;
  });

  const neonColors = ['#00ccff', '#cc00ff', '#ff8800', '#ff0044', '#ffee00'];

  function getSandglassCenter() {
    const sandglass = document.querySelector(".sandglass-container");
    const rect = sandglass.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + rect.height / 2 + window.scrollY
    };
  }

  function triggerExplosion() {
    console.log("沙漏被點了！");
    const { x: centerX, y: centerY } = getSandglassCenter();
    const color = neonColors[Math.floor(Math.random() * neonColors.length)];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 20;
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

  function updateParticles() {
    ctx.clearRect(0, 0, explosionCanvas.width, explosionCanvas.height);
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

  // ✅ 正確掛上全域函式
  window.triggerExplosion = triggerExplosion;
});


