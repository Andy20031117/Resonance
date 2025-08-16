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
    { name: "咩呷啥", desc: "哩咩呷啥？獻給選擇困難的你" , img: "grouplogo/meijiasha.png" , ig: "https://www.instagram.com/mei.jia.sha?igsh=MnJmMm1ocHJ6NjZs", web: "https://meijiasha.cc/" },
  ],
  clothing: [
    { name: "Second Han Easy", desc: "一手交易，交二手貨。" , img: "grouplogo/secondhaneasy.png" , ig: "https://www.instagram.com/second_han.easy?igsh=MThnbWlmcHAwMThlcA==", web: "https://www.example.com" },
    { name: "Vintaglo", desc: "每一件舊衣不只是循環利用，而是展現態度與風格的載體" , img: "grouplogo/vintaglo.png" ,ig: "https://www.instagram.com/vintaglo.__?igsh=OW05azV6c2QzZjV6", web: "https://www.example.com" },
  ],
  housing: [
    { name: "藥嚀管", desc: "藥嚀在手，吃藥不愁。" , img: "grouplogo/yaoningguan.png" , ig: "https://www.instagram.com/yao_ning_guan?igsh=MTN0Mnp6aG9vd25vdg==", web: "https://www.example.com" },
    { name: "未來居所", desc: "讓AI協助你大展身手，創建屬於你自己的房屋。" , img: "grouplogo/futurenest.png" , ig: "https://www.instagram.com/future_nest111?igsh=MWxoNjlocHVhYjBlcw==", web: "https://www.example.com" },
  ],
  transport: [
    { name: "自律控肉飯", desc: "時間自律是大家的課題，一起加入我們一起自律。" , img: "grouplogo/kongrolab.png" , ig: "https://www.instagram.com/kongro__lab?igsh=azB1Z2l6aG03NHl2", web: "https://www.example.com" },
  ],
  education: [
    { name: "樂壓talks", desc: "AI陪你聊心事，壓力不再自己扛" , img: "grouplogo/leyatalks.png" , ig: "https://www.instagram.com/le_ya.talks?igsh=a3U3aDgxbTNjNnAx", web: "https://leyatalks.com/" },
    { name: "Lunia", desc: "做一個能記錄夢的地方。在Lunia,夢不只是夢。" , img: "grouplogo/lunia.png" , ig: "https://www.instagram.com/lunia_diary?igsh=czVkdjgzNWI3NWM1", web: "https://www.example.com" },
    { name: "MaMoon", desc: "會說話的好朋友 陪伴孩子的每一天。" , img: "grouplogo/mamoon.png" , ig: "https://www.instagram.com/mamoon_0223?igsh=MTIyZHFpMmc4ZDE2Ng==", web: "https://www.example.com" },
    { name: "彼站彼話", desc: "傳統文化不無聊，帶你進入趣味的閩南圈。" , img: "grouplogo/bizhanbihua.png" , ig: "https://www.instagram.com/hitetsam_game?igsh=YXl2Y3RzeDZ2bTR1", web: "https://www.example.com" },
  ],
  entertainment: [
    { name: "青山", desc: "青山出巡，故事啟程『一次跨越時代的對話，一段重新連結傳統的旅程』" , img: "grouplogo/qingshan.png" , ig: "https://www.instagram.com/qingshan.ics?igsh=MWVzaGhzYzY1N3htNA==", web: "https://www.example.com" },
    { name: "Rightway", desc: "右滑，遇見你的下一站！" , img: "grouplogo/rightway.png" , ig: "https://www.instagram.com/rightway.trip?igsh=MTM2ZXAxc2U1ZGd4Zg==", web: "https://www.example.com" },
    { name: "光腳工作室", desc: "劇情冒險遊戲熱烈開發中，關注更多我們的開發日常和進度吧！" , img: "grouplogo/lightfoot.png" , ig: "https://www.instagram.com/lightfootgames?igsh=N2JzaHh2c2h2MmRr", web: "https://www.example.com" },
  ]
};

const categoryIcons = {
  food: "food1.png",
  clothing: "cloth1.png",
  housing: "house1.png",
  transport: "transport1.png",
  education: "education1.png", // 育的圖
  entertainment: "entertainment1.png"
};

document.querySelectorAll('.group-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const category = btn.getAttribute('data-category');
    if (!categoryData[category]) {
      console.error(`Category ${category} 不存在於 categoryData 中`);
      return;
    }

    const groups = categoryData[category];
    categoryTitle.innerHTML = `
      ${categoryIcons[category] ? `<img src="${categoryIcons[category]}" alt="${btn.alt}" class="category-icon">` : ''}
      <span>${btn.alt || '小組'}</span>
    `;
    groupsContainer.innerHTML = '';

    groups.forEach(group => {
      const card = document.createElement('div');
      card.className = 'group-card';
      console.log(group.img);
      card.innerHTML = `${group.img ? `<img src="${group.img}" alt="${group.name}" class="group-img">` : ''}
                        <h3>${group.name}</h3>
                        <p>${group.desc}</p>
                        <div class="card-links">
                          ${group.ig ? `<a href="${group.ig}" target="_blank"><img src="ig icon.png" class="icon" alt="Instagram"></a>` : ''}
                          ${group.web ? `<a href="${group.web}" target="_blank"><img src="web icon.png" class="icon" alt="Website"></a>` : ''}
                        </div>
      `;

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



// ✅ 所有動畫與功能統一初始化
document.addEventListener("DOMContentLoaded", () => {

  // ✅ GSAP 外掛註冊
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

  // ✅ 最新消息動畫區塊
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

  // ✅ 展覽資訊切換功能
  const posterImage = document.getElementById('poster-image');
  const toggleIcon = document.getElementById('toggle-icon');
  const posterLabel = document.getElementById('poster-label');

  let isIndoor = true;

  toggleIcon.addEventListener('click', () => {
    posterImage.classList.add('flipping');

    setTimeout(() => {
      isIndoor = !isIndoor;
      posterImage.src = isIndoor
        ? 'venueinfo.png'
        : 'venueinfo2.png';
      posterImage.alt = isIndoor
        ? '校內展資訊'
        : '校外展資訊';
      posterLabel.textContent = isIndoor
        ? '目前顯示：校內展資訊'
        : '目前顯示：校外展資訊';
    }, 300); // 在半翻的時候換圖片

    setTimeout(() => {
      posterImage.classList.remove('flipping');
    }, 600); // 動畫結束後移除 class
  });

  // ✅ 雲朵區塊：淡入動畫 + 上下浮動
  gsap.utils.toArray(".cloud-item").forEach((el) => {
    // 淡入進場
    gsap.from(el, {
      opacity: 0,
      y: 60,
      duration: 1,
      ease: "sine.inOut",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none reset"
      }
    });

    // 上下浮動
    gsap.to(el, {
      y: "+=10",
      duration: 2.5 + Math.random(),
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: Math.random() * 2
    });
  });

  console.log("✅ 所有功能與動畫已成功載入");
});


// ✅ 確保插件載入(紙飛機)
gsap.registerPlugin(MotionPathPlugin);

// ✅ 取得元素
const plane = document.querySelector('.paper-plane');
const trailSVG = document.querySelector('.trail-svg');
const path = document.querySelector('#flight-path');

// ✅ 拖尾線段初始化
const trailSegments = [];
const segmentCount = 5;

for (let i = 0; i < segmentCount; i++) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("class", "trail-line");
  trailSVG.appendChild(line);
  trailSegments.push(line);
}

const trailHistory = Array(segmentCount).fill({ x: 0, y: 0 });

// ✅ 紙飛機沿著路徑飛行
gsap.to(plane, {
  duration: 12,
  repeat: -1,
  ease: "none",
  motionPath: {
    path: path,
    align: path,
    alignOrigin: [0.5, 0.5],
    autoRotate: true
  },
  onUpdate: function () {
    const currentX = gsap.getProperty(plane, "x");
    const currentY = gsap.getProperty(plane, "y");

    trailHistory.pop();
    trailHistory.unshift({ x: currentX, y: currentY });

    for (let i = 0; i < trailSegments.length; i++) {
      const curr = trailHistory[i];
      const next = trailHistory[i + 1] || curr;
      trailSegments[i].setAttribute("x1", curr.x);
      trailSegments[i].setAttribute("y1", curr.y);
      trailSegments[i].setAttribute("x2", next.x);
      trailSegments[i].setAttribute("y2", next.y);
    }
  }
});


// ✅ 社群媒體風箏
document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('#media');
  const kite = section.querySelector('.kite');
  const cards = [...section.querySelectorAll('.info-card')];

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 風箏浮上
        kite.classList.add('float');

        // 卡片依序浮現
        cards.forEach((card, i) => {
          card.style.setProperty('--delay', `${i * 0.2}s`); // 每張延遲 0.2s
          // 先重置再加上 show → 確保每次進入都能重新播放
          card.classList.remove('show');
          requestAnimationFrame(() => card.classList.add('show'));
        });
      } else {
        // 區塊離開後重置，下次再進來會重新播放
        kite.classList.remove('float');
        cards.forEach(card => card.classList.remove('show'));
      }
    });
  }, { threshold: 0.3 });

  observer.observe(section);
});





// 返回頂部按鈕
const backToTopBtn = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    backToTopBtn.classList.add("show");
  } else {
    backToTopBtn.classList.remove("show");
  }
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});
