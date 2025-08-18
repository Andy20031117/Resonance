// 建立背景層節點（若頁面沒有就自動插入）
(function ensureBgLayers() {
  if (document.getElementById('electric-bg')) return;
  const wrap = document.createElement('div');
  wrap.id = 'electric-bg';
  wrap.innerHTML = `
    <canvas id="particle-layer"></canvas>
    <svg id="lightning-layer"></svg>
    <div id="scanline-overlay"></div>
  `;
  document.body.appendChild(wrap);
})();

// === 粒子背景：簡易高效浮動粒子 ===
(function particleInit() {
  const canvas = document.getElementById('particle-layer');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const COUNT = Math.min(70, Math.floor((window.innerWidth * window.innerHeight) / 22000)); // 自適應數量

  function resize() {
    W = canvas.width = Math.floor(window.innerWidth * DPR);
    H = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawnParticle() {
    return {
      x: rand(0, W),
      y: rand(0, H),
      r: rand(0.8, 2.2) * DPR,
      a: rand(0.25, 0.7),
      vx: rand(-0.12, 0.12) * DPR,
      vy: rand(-0.18, 0.18) * DPR,
      tw: rand(2, 6) // 微閃爍週期
    };
  }

  function init() {
    particles = [];
    for (let i = 0; i < COUNT; i++) particles.push(spawnParticle());
  }

  function step(t) {
    ctx.clearRect(0, 0, W, H);
    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      // 微閃爍透明度
      const flicker = 0.5 + 0.5 * Math.sin((t / 1000) * p.tw + p.x * 0.001);
      const alpha = p.a * (0.6 + 0.4 * flicker);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160,255,255,${alpha})`;
      ctx.fill();

      // 輕微拖尾
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 6, p.y - p.vy * 6);
      ctx.strokeStyle = `rgba(100,255,255,${alpha * 0.35})`;
      ctx.lineWidth = 1 * DPR;
      ctx.stroke();
    }
    requestAnimationFrame(step);
  }

  window.addEventListener('resize', () => { resize(); init(); });
  resize(); init(); requestAnimationFrame(step);
})();

// === 閃電線條：隨機短促閃爍 ===
(function lightningInit() {
  const svg = document.getElementById('lightning-layer');
  let W = window.innerWidth, H = window.innerHeight;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }

  function lightningOnce() {
    // 隨機在畫面某一側生成一條折線
    const points = [];
    const startX = Math.random() < 0.5 ? 0 : W;
    const targetX = Math.random() * W;
    const steps = 6 + Math.floor(Math.random() * 4);
    const baseY = Math.random() * H;

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const x = startX + (targetX - startX) * t + (Math.random() - 0.5) * 60;
      const y = baseY + (Math.random() - 0.5) * 140;
      points.push([x, y]);
    }

    const d = points.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'lightning-line');
    path.setAttribute('d', d);
    svg.appendChild(path);

    // 設置 dash 動畫
    const len = path.getTotalLength();
    path.setAttribute('stroke-dasharray', `${len}`);
    path.setAttribute('stroke-dashoffset', `${len}`);

    // 顯示並閃爍
    path.style.opacity = '1';
    path.animate(
      [
        { strokeDashoffset: len, opacity: 0.0 },
        { strokeDashoffset: 0,   opacity: 1.0, offset: 0.2 },
        { strokeDashoffset: 0,   opacity: 0.0 }
      ],
      { duration: 220, easing: 'cubic-bezier(.3,.7,.4,1)' }
    ).onfinish = () => {
      svg.removeChild(path);
    };
  }

  function schedule() {
    // 隨機間隔觸發
    const next = 1200 + Math.random() * 2600; // 1.2s ~ 3.8s
    setTimeout(() => {
      // 小機率一次閃 2~3 條
      const burst = Math.random() < 0.25 ? (2 + Math.floor(Math.random() * 2)) : 1;
      for (let i = 0; i < burst; i++) {
        setTimeout(lightningOnce, i * 70);
      }
      schedule();
    }, next);
  }

  window.addEventListener('resize', resize);
  resize(); schedule();
})();
