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

// 門動畫
const leftDoor = document.querySelector('.left-door');
const rightDoor = document.querySelector('.right-door');

function playDoorTransition(openToTV = true) {
  return new Promise(resolve => {
    leftDoor.classList.add('active');
    rightDoor.classList.add('active');
    leftDoor.classList.remove('open');
    rightDoor.classList.remove('open');

    setTimeout(() => {
      leftDoor.classList.add('open');
      rightDoor.classList.add('open');
      resolve();
    }, 1200);
  });
}

ScrollTrigger.create({
  trigger: "#tv-section",
  start: "top 80%",
  end: "top 20%",
  onEnter: () => playDoorTransition(true),
  onLeaveBack: () => playDoorTransition(false),
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

// TV 區互動展示
const tvScreen = document.getElementById('tv-screen');
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


document.querySelectorAll('.tv-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const category = btn.getAttribute('data-category');
    const groups = categoryData[category];
    categoryTitle.textContent = btn.alt;
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
