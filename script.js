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

// 潑墨動畫修正
const canvas = document.getElementById('ink-splash-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
const particleCount = 600; // 更豐富但適度
const splashX = window.innerWidth * 0.3;
const splashY = window.innerHeight * 0.5;

function createParticles() {
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: splashX,
      y: splashY,
      radius: Math.random() * 60 + 10,
      opacity: Math.random() * 0.2 + 0.3,
      scale: 0,
      speed: Math.random() * 0.05 + 0.01,
      dx: (Math.random() - 0.5) * 15,
      dy: (Math.random() - 0.5) * 15
    });
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let allDone = true;
  particles.forEach(p => {
    p.scale += p.speed;
    p.x += p.dx * p.speed;
    p.y += p.dy * p.speed;
    if (p.scale < 1) allDone = false;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * p.scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${p.opacity})`;
    ctx.fill();
  });
  if (!allDone) {
    requestAnimationFrame(animateParticles);
  } else {
    revealText();
  }
}

function splashIn() {
  createParticles();
  animateParticles();
}

// 打字機效果
function typeWriterEffect(element, text, speed = 50) {
  element.textContent = "";
  let i = 0;
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}

function revealText() {
  const title = document.querySelector('.intro-title');
  const subtitles = [
    document.getElementById('subtitle-line-1'),
    document.getElementById('subtitle-line-2'),
    document.getElementById('subtitle-line-3'),
    document.getElementById('subtitle-line-4')
  ];
  gsap.to(title, { opacity: 1, duration: 1 });
  const texts = subtitles.map(sub => sub.textContent);
  subtitles.forEach((el, idx) => {
    setTimeout(() => {
      typeWriterEffect(el, texts[idx], 60);
      gsap.to(el, { opacity: 1, duration: 0.5 });
    }, 1200 + idx * 1000); // 每行間隔依序顯示
  });
}

window.addEventListener('load', splashIn);





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
