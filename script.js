gsap.registerPlugin(ScrollTrigger);

// 沙漏背景推進
gsap.to("#walkway", {
  scale: 1.3,
  y: -150,
  ease: "none",
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "bottom top",
    scrub: true
  }
});

// Hero 淡出
gsap.to(".hero-content", {
  opacity: 0,
  y: -50,
  scrollTrigger: {
    trigger: ".spacer",
    start: "top center",
    end: "top top",
    scrub: true
  }
});

// 背景淡出進入介紹段
ScrollTrigger.create({
  trigger: ".intro-section",
  start: "top 60%",
  onEnter: () => gsap.to("#walkway", { opacity: 0, duration: 0.5 }),
  onLeaveBack: () => gsap.to("#walkway", { opacity: 1, duration: 0.5 })
});


const links = document.querySelectorAll("nav a");
const transition = document.getElementById("train-transition");
const train = document.getElementById("train-image");
const mist = document.getElementById("mist-effect");

links.forEach(link => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");
    const targetElement = document.querySelector(targetId);

    // 顯示轉場容器
    transition.style.display = "block";

    // 1️⃣ 初始位置重設：右側畫面外
    train.style.transform = "translate(100vw, -50%)";
    mist.style.transform = "translateX(100vw) translateY(-50%)";

    void train.offsetWidth;
    void mist.offsetWidth;

    // 2️⃣ 滑入畫面（火車 + 煙霧）
    train.style.transform = "translate(0vw, -50%)";
    mist.style.transform = "translateX(65vw) translateY(-50%)"; // 可微調

    // 3️⃣ 畫面跳轉
    setTimeout(() => {
      targetElement.scrollIntoView({ behavior: "auto" });
    }, 1200);

    // 4️⃣ 離開畫面（火車 + 煙霧）
    setTimeout(() => {
      train.style.transform = "translate(-100vw, -50%)";
      mist.style.transform = "translateX(-60vw) translateY(-50%)";
    }, 1300);

    // 5️⃣ 關閉轉場畫面
    setTimeout(() => {
      transition.style.display = "none";
    }, 2000);
  });
});








// ====== 門動畫完整鎖定滾輪版本 ======

const leftDoor = document.querySelector('.left-door');
const rightDoor = document.querySelector('.right-door');

// 滾動鎖定 / 解鎖
function lockScroll() {
    document.body.style.overflow = 'hidden';
    window.addEventListener('wheel', preventDefault, { passive: false });
    window.addEventListener('touchmove', preventDefault, { passive: false });
}
function unlockScroll() {
    document.body.style.overflow = '';
    window.removeEventListener('wheel', preventDefault);
    window.removeEventListener('touchmove', preventDefault);
}
function preventDefault(e) {
    e.preventDefault();
}

// 播放門動畫完整鎖住滾動流程
function playDoorTransition(openToTV = true) {
    return new Promise(resolve => {
        lockScroll(); // 播放前鎖住滾動

        // ===== 關門動畫開始 =====
        leftDoor.classList.add('active');
        rightDoor.classList.add('active');
        leftDoor.classList.remove('open');
        rightDoor.classList.remove('open');

        setTimeout(() => {
            // ===== 開門動畫開始 =====
            leftDoor.classList.add('open');
            rightDoor.classList.add('open');

            setTimeout(() => {
                unlockScroll(); // 播放完整解鎖滾動
                resolve();
            }, 1200); // 開門動畫時間

        }, 1200); // 關門動畫時間
    });
}

// 防止重複觸發
let doorAnimationPlaying = false;

function safePlayDoorTransition(openToTV = true) {
    if (doorAnimationPlaying) return;
    doorAnimationPlaying = true;

    playDoorTransition(openToTV).then(() => {
        doorAnimationPlaying = false;
    });
}

// ScrollTrigger 設定
ScrollTrigger.create({
    trigger: "#group-section",
    start: "top 80%",
    end: "top 20%",
    onEnter: () => safePlayDoorTransition(true),
    onLeaveBack: () => safePlayDoorTransition(false),
});



// 粒子沙效果
const container = document.getElementById("sand-container");
for (let i = 0; i < 800; i++) {
  const grain = document.createElement("div");
  grain.classList.add("sand-grain");
  const size = Math.random() * 3 + 1;
  grain.style.width = `${size}px`;
  grain.style.height = `${size}px`;
  grain.style.left = `${Math.random() * 100}vw`;
  grain.style.top = `-${Math.random() * 100}px`;
  const duration = Math.random() * 5 + 4;
  const delay = Math.random() * 1.5;
  grain.style.animationDuration = `${duration}s`;
  grain.style.animationDelay = `${delay}s`;
  container.appendChild(grain);
}

// 滑鼠拖尾
window.addEventListener('mousemove', (e) => {
  for (let i = 0; i < 2; i++) {
    const dot = document.createElement('div');
    dot.className = 'mouse-trail';
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;
    dot.style.left = `${e.pageX + offsetX}px`;
    dot.style.top = `${e.pageY + offsetY}px`;
    document.getElementById("trail-container").appendChild(dot);
    setTimeout(() => dot.remove(), 1200);
  }
});

// CRT 拖尾
window.addEventListener("mousemove", (e) => {
  const dot = document.createElement("div");
  dot.className = "crt-dot";
  dot.style.left = `${e.pageX}px`;
  dot.style.top = `${e.pageY}px`;
  document.getElementById("crt-container").appendChild(dot);
  setTimeout(() => dot.remove(), 1200);
});

// 導覽列變色
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  navbar.classList.toggle("scrolled", window.scrollY > 30);
});

// 載入動畫
window.addEventListener("load", () => {
  const loader = document.getElementById("loading-overlay");
  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => loader.style.display = "none", 1200);
  }, 1800);
});

// GSAP 註冊
gsap.registerPlugin(ScrollTrigger);



// ========== 背景星光動畫 ==========
const bgCanvas = document.getElementById("background-canvas");
const bgCtx = bgCanvas.getContext("2d");
let stars = [];

function resizeBGCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
resizeBGCanvas();
window.addEventListener("resize", resizeBGCanvas);

for (let i = 0; i < 120; i++) {
  stars.push({
    x: Math.random() * bgCanvas.width,
    y: Math.random() * bgCanvas.height,
    radius: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.3 + 0.1
  });
}

function drawStars() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgCtx.fillStyle = "#fce7a4aa";
  for (let s of stars) {
    bgCtx.beginPath();
    bgCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    bgCtx.fill();
    s.y += s.speed;
    if (s.y > bgCanvas.height) s.y = 0;
  }
  requestAnimationFrame(drawStars);
}
drawStars();


// ========== 沙漏沙粒動畫 ==========
const sandCanvas = document.getElementById("sand-canvas");
const sandCtx = sandCanvas.getContext("2d");
let grains = [];

function initGrains() {
  grains = [];
  for (let i = 0; i < 150; i++) {
    grains.push({
      x: Math.random() * sandCanvas.width,
      y: Math.random() * (sandCanvas.height / 2),
      vy: 0
    });
  }
}
initGrains();

function drawSand() {
  sandCtx.clearRect(0, 0, sandCanvas.width, sandCanvas.height);
  sandCtx.fillStyle = "#fce7a4";
  for (let g of grains) {
    g.vy += 0.05; // gravity
    g.y += g.vy;
    if (g.y > sandCanvas.height - 5) {
      g.y = Math.random() * 10;
      g.vy = 0;
    }
    sandCtx.beginPath();
    sandCtx.arc(g.x, g.y, 1.5, 0, Math.PI * 2);
    sandCtx.fill();
  }
  requestAnimationFrame(drawSand);
}
drawSand();


// ========== 旋轉文字控制 ==========
const textSVG = document.getElementById("text-svg");
let currentSpeed = 40;       // 初始旋轉秒數
let targetSpeed = 40;        // 目標秒數
const speedStep = 0.2;       // 平滑調整速度
const root = document.documentElement;

// hover 停止旋轉
textSVG.addEventListener("mouseenter", () => {
  textSVG.style.animationPlayState = "paused";
});
textSVG.addEventListener("mouseleave", () => {
  textSVG.style.animationPlayState = "running";
});

// 點擊加速（逐漸加快）
textSVG.addEventListener("click", () => {
  if (targetSpeed > 5) {
    targetSpeed -= 5;
  }
});

// 平滑更新動畫變數
function updateSpeed() {
  if (currentSpeed !== targetSpeed) {
    currentSpeed += (targetSpeed - currentSpeed) * speedStep;
    if (Math.abs(currentSpeed - targetSpeed) < 0.1) {
      currentSpeed = targetSpeed;
    }
    root.style.setProperty('--rotate-speed', currentSpeed + "s");
  }
  requestAnimationFrame(updateSpeed);
}
updateSpeed();








// TV 區互動展示
const tvScreen = document.getElementById('group-screen');
const categoryDisplay = document.getElementById('category-display');
const categoryTitle = document.getElementById('category-title');
const groupsContainer = document.getElementById('groups-container');
const backButton = document.getElementById('back-button');

const categoryData = {
  food: [
    { name: "咩呷啥", desc: "從小吃到美食，讓我們為你一手包辦。" }
  ],
  clothing: [
    { name: "Second Han Easy", desc: "打造校園二手生活圈，屬於大學生的歸屬感。" },
    { name: "Vintaglo", desc: "一鍵選擇今天的OOTD，搭出你的生活樣貌。" }
  ],
  housing: [
    { name: "藥嚀管", desc: "藥嚀在手，吃藥不愁，打造你的AI健康顧問。" },
    { name: "未來居所", desc: "讓AI協助你大展身手，創建屬於你自己的房屋。" }
  ],
  transport: [
    { name: "自律控肉飯", desc: "挑選你想要的生活樣子，自律就從今天陪你一起。" }
  ],
  education: [
    { name: "樂壓talks", desc: "用AI伙伴幫你關注心理健康，你的情緒我能看見！" },
    { name: "Lunia", desc: "AI結合夢境紀錄，一種和自己對話的方式。" },
    { name: "MaMoon", desc: "化身慈愛的母親，陪伴孩子走過語言黃金期。" },
    { name: "彼站彼話", desc: "傳統文化不無聊，帶你進入趣味的閩南圈。" }
  ],
  entertainment: [
    { name: "青山", desc: "一次跨越時代的對話，述說神明與人間的故事。" },
    { name: "RightAway", desc: "你的行李箱裝的不只是行李，右滑遇見陪伴你的下一站。" },
    { name: "光腳工作室", desc: "創造寓言色彩的魔法世界，體驗AI思維扮演。" }
  ]
};


document.querySelectorAll('.group-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const category = btn.getAttribute('data-category');
    if (!categoryData[category]) {
      console.error(`Category ${category} 不存在於 categoryData 中`);
      return;
    }

    const groups = categoryData[category];
    categoryTitle.textContent = btn.alt || '小組';
    groupsContainer.innerHTML = '';

    groups.forEach(group => {
      const card = document.createElement('div');
      card.className = 'group-card';
      card.innerHTML = `<h3>${group.name}</h3><p>${group.desc}</p>`;
      groupsContainer.appendChild(card);
    });

    gsap.to(tvScreen, { opacity: 0, duration: 0.5, onComplete: () => {
      tvScreen.style.display = 'none';
      categoryDisplay.style.display = 'flex';
      gsap.fromTo(categoryDisplay, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    }});
  });
});

backButton.addEventListener('click', () => {
  gsap.to(categoryDisplay, { opacity: 0, duration: 0.5, onComplete: () => {
    categoryDisplay.style.display = 'none';
    tvScreen.style.display = 'flex';
    gsap.fromTo(tvScreen, { opacity: 0 }, { opacity: 1, duration: 0.5 });
  }});
});

// 最新消息動畫區：
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray(".news-item").forEach((item, index) => {
    gsap.from(item, {
      opacity: 0,
      y: 50,
      duration: 0.8,
      delay: index * 0.2,
      scrollTrigger: {
        trigger: item,
        start: "top 80%",
        toggleActions: "play none none none",
      }
    });
  });

  // 若需要 SVG 電話線動畫可於此添加：
  // gsap.from("#telephone-line-path", {
  //   strokeDasharray: "500",
  //   strokeDashoffset: "500",
  //   duration: 2,
  //   scrollTrigger: {
  //     trigger: "#news",
  //     start: "top center",
  //     toggleActions: "play none none none",
  //   }
  // });
});
