/* ============================================================
   結果頁（只見 3 張：左／中／右）
   進場動畫：四面八方聚攏 → 停格 → 扇形攤開 → 進入 3D 環
   藍紫背景視差、按鈕掃描、翻面火花；預載 endBG.png / talocard.png
============================================================ */
(function () {
  "use strict";

  /* ---------- 工具 ---------- */
  const $  = (sel, el=document)=> el.querySelector(sel);
  const $$ = (sel, el=document)=> Array.from(el.querySelectorAll(sel));
  const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));
  const throttle = (fn, wait=300) => { let t=0; return (...a)=>{ const n=Date.now(); if(n-t>=wait){ t=n; fn(...a) } } };
  const fmtTime = (s)=>{ const m=Math.floor(s/60); const sec=(s%60).toFixed(1).padStart(4,"0"); return `${String(m).padStart(2,"0")}:${sec}`; };
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 預載圖片與套用背景 ---------- */
  const ASSETS = ["endBG.png", "talocard.png"];
  function preloadImages(urls){
    return Promise.all(urls.map(src => new Promise(res=>{
      const img = new Image();
      img.onload = () => res(true);
      img.onerror = () => res(false);
      img.src = src;
    })));
  }
  function applyBackground(){
    const bg = $(".bg__image");
    if(bg){ bg.style.backgroundImage = 'url("endBG.png")'; }
  }

  /* ---------- 資料 ---------- */
  function getResult(){
    try{ const raw=localStorage.getItem("gameResult"); if(raw) return JSON.parse(raw); }catch{}
    return {
      character:"盾穩",
      score:12780, grade:"A",
      timeSurvived:92.6, distance:1680,
      logoPiecesRun:3, logoPiecesTotal:12, logoCompletionCumulative:58,
      leaderboard:[
        {name:"YOU", score:12780, time:92.6, date:"2025-08-31"},
        {name:"A", score:15210, time:110.3, date:"2025-08-30"},
        {name:"B", score:9800,  time:75.2,  date:"2025-08-29"},
      ],
      rank:2, isPersonalBest:false
    };
  }
  const computeGrade = (score)=> score>=15000?"S":score>=12000?"A":score>=9000?"B":score>=6000?"C":"D";
  const result = (()=>{ const r=getResult(); if(!r.grade) r.grade=computeGrade(r.score||0); return r; })();
  const leaderboard = (()=>{ try{ const raw=localStorage.getItem("leaderboard"); if(raw) return JSON.parse(raw);}catch{} return result.leaderboard||[]; })();

  /* ---------- 狀態與 DOM 參照（啟動時賦值） ---------- */
  let ringEl, sparkLayer;
  const state = { focusIdx:0, radius: window.innerWidth < 920 ? 240 : 340, rotation:0 };

  /* ---------- 卡牌資料 ---------- */
  const cards = [
    { key:"hero", title: result.character || "角色", badge:"R",
      front: heroFront(), back: `<div class="card__body"><p>向左右移動卡牌，任何卡都可翻面閱讀。</p></div>` },
    { key:"score", title:"總結成績", badge:"S",
      front: scoreFront(), back:`<div class="card__body"><p>分數/評級＋Logo 碎片累積完成度。</p></div>` },
    { key:"time", title:"生存時間", badge:"T",
      front: timeFront(), back:`<div class="card__body"><p>你讓時間的沙更慢地流動。</p></div>` },
    { key:"distance", title:"距離／進度", badge:"P",
      front: distanceFront(), back:`<div class="card__body"><p>越過的每一步，都是證據。</p></div>` },
    { key:"leaderboard", title:"高手榜", badge:"L",
      front: leaderboardFront(), back:`<div class="card__body"><p>與自己或夥伴比一比！</p></div>` }
  ];

//卡片區//
function createCardDOM(card, idx){
  const el = document.createElement("article");
  el.className = "card"; el.setAttribute("role","listitem"); el.dataset.index = String(idx);

  const inner = document.createElement("div"); inner.className="card-inner";

  const front = document.createElement("div");
  front.className = "card-face card-front";
  front.innerHTML = `
    <div class="card__head">
      <div class="badge">${card.badge}</div>
      <div class="card__title">${card.title}</div>
    </div>
    ${card.front}
  `;

  const back = document.createElement("div");
  back.className  = "card-face card-back";
  // 背面不放任何 HTML，純貼圖由 CSS 控制

  inner.appendChild(front); inner.appendChild(back); el.appendChild(inner);

  /* ✅ 預設就是背面（玩家點擊後才會翻回正面） */
  el.classList.add("flipped");

  el.addEventListener("click", (e)=>{
    el.classList.toggle("flipped");
    spawnSpark(e.clientX, e.clientY);
  });

  return el;
}



  function mountCards(){
    ringEl.innerHTML = "";
    cards.forEach((c,i)=> ringEl.appendChild(createCardDOM(c,i)));
    if (!prefersReduced) {
      introAnimation().then(()=> { setFocus(0,false); bindInputs(); });
    } else {
      setFocus(0,false); bindInputs();
    }
  }

  /* ---------- 正常佈局（只見 3 張） ---------- */
  function layout(){
    const step = 360 / cards.length;
    const visible = new Set([wrap(state.focusIdx-1), state.focusIdx, wrap(state.focusIdx+1)]);
    $$(".card", ringEl).forEach((cardEl, i)=>{
      const angle = step * i + state.rotation;
      cardEl.style.transform =
        `translate(-50%,-50%) rotateY(${angle}deg) translateZ(${state.radius}px) rotateY(${-angle}deg)`;
      const isCenter = i === state.focusIdx;
      cardEl.classList.toggle("is-center", isCenter);
      const show = visible.has(i);
      cardEl.classList.toggle("is-hidden", !show);
      cardEl.setAttribute("aria-hidden", show ? "false" : "true");
    });
  }
  const wrap = (i)=> { const n=cards.length; return ((i%n)+n)%n; };

  function setFocus(idx, animate=true){
    state.focusIdx = wrap(idx);
    const step = 360 / cards.length;
    const target = -step * state.focusIdx;
    if (animate){ animateRotationTo(target, 320); } else { state.rotation = target; layout(); }
  }

  function animateRotationTo(target, dur=300){
    const start = state.rotation;
    let diff = ((target - start) % 360 + 540) % 360 - 180; // shortest diff
    const t0 = performance.now();
    const ease = t => (t<.5 ? 2*t*t : -1+(4-2*t)*t);
    function tick(now){
      const p = Math.min((now - t0) / dur, 1);
      state.rotation = start + diff * ease(p);
      layout();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- 進場動畫：四向→停格→扇形→3D ---------- */
  async function introAnimation(){
  const els = $$(".card", ringEl);

  // ✅ 先確保全部都是「背面」狀態
  els.forEach(el => el.classList.add("flipped"));

  // A) 四面八方聚攏（不要移除 flipped）
  els.forEach((el, i)=>{
    el.classList.remove("is-hidden","is-center"); // ❌ 不要 .flipped
    el.style.transition = "none";
    const dir = ["top","right","bottom","left","top"][i];
    const off = 65; // vw/vh
    const rot = (Math.random()*10-5);
    const tx = dir==="left" ? -off : dir==="right" ? off : 0;
    const ty = dir==="top"  ? -off : dir==="bottom"? off : 0;
    el.style.transform =
      `translate(calc(-50% + ${tx}vw), calc(-50% + ${ty}vh)) rotateZ(${rot}deg) scale(.96)`;
    el.style.opacity = "0";
  });

  await nextFrame();
  await sleep(60);

  // 飛入中心堆疊（仍保持背面）
  els.forEach((el)=>{
    el.style.transition = "transform .5s cubic-bezier(.2,.7,.2,1), opacity .4s ease";
    const rot = (Math.random()*6-3);
    el.style.transform = `translate(-50%,-50%) rotateZ(${rot}deg) scale(.96)`;
    el.style.opacity = "1";
  });
  await sleep(520);

  // 停格
  await sleep(180);

  // 扇形攤開（仍是背面）
  els.forEach((el,i)=>{
    const base = (i - (els.length-1)/2);
    const spread = 28 * base;
    const offset = 90 * base;
    el.style.transition = "transform .45s cubic-bezier(.2,.7,.2,1)";
    el.style.transform = `translate(-50%,-50%) rotateZ(${spread}deg) translateX(${offset}px) scale(.97)`;
  });
  await sleep(520);

  // 進入 3D 環（仍是背面，直到玩家點擊）
  els.forEach((el,i)=>{
    const step = 360 / cards.length;
    const angle = step * i;
    el.style.transition = "transform .6s cubic-bezier(.2,.7,.2,1)";
    el.style.transform =
      `translate(-50%,-50%) rotateY(${angle}deg) translateZ(${state.radius}px) rotateY(${-angle}deg)`;
  });
  await sleep(650);

  layout();
}

  const sleep = (ms)=> new Promise(r=> setTimeout(r, ms));
  const nextFrame = ()=> new Promise(r=> requestAnimationFrame(()=> r()));

  /* ---------- 輸入：鍵盤／熱區／滾輪／視差 ---------- */
  function bindInputs(){
    window.addEventListener("keydown",(e)=>{
      if (e.key === "ArrowRight") step( 1);
      if (e.key === "ArrowLeft")  step(-1);
    });

    const left  = $("#hz-left");
    const right = $("#hz-right");
    const auto = { timer:null };
    const startAuto = (dir)=>{ step(dir); auto.timer = setInterval(()=> step(dir), 650); };
    const stopAuto  = ()=>{ if(auto.timer){ clearInterval(auto.timer); auto.timer=null; } };

    ["mouseenter","touchstart"].forEach(evt=>{
      left .addEventListener(evt, ()=> startAuto(-1), {passive:true});
      right.addEventListener(evt, ()=> startAuto( 1), {passive:true});
    });
    ["mouseleave","touchend","touchcancel"].forEach(evt=>{
      left .addEventListener(evt, stopAuto, {passive:true});
      right.addEventListener(evt, stopAuto, {passive:true});
    });
    left .addEventListener("click", ()=> step(-1));
    right.addEventListener("click", ()=> step( 1));

    ringEl.addEventListener("wheel", throttle((e)=>{
      const dir = (e.deltaX || e.deltaY) > 0 ? 1 : -1;
      step(dir); e.preventDefault();
    }, 280), {passive:false});

    window.addEventListener("mousemove", throttle((e)=>{
      const x = (e.clientX / window.innerWidth  - 0.5);
      const y = (e.clientY / window.innerHeight - 0.5);
      const neb = $(".bg__nebula"); const con = $(".bg__constellations");
      if (neb) neb.style.transform = `translate(${x*-2.5}%, ${y*-2.5}%) scale(1.1)`;
      if (con) con.style.transform = `translate(${x*2}%, ${y*2}%) rotate(0.02turn)`;
    }, 16));
  }
  const step = (dir)=> setFocus(state.focusIdx + dir);

  /* ---------- 卡面模板 ---------- */
  function heroFront(){
    const line = heroLine(result.character);
    return `
      <div class="card__body">
        <div class="kpi">
          <div class="kpi__row"><span class="kpi__label">角色</span><span class="kpi__value">${escapeHTML(result.character || "—")}</span></div>
          <div class="kpi__row"><span class="kpi__label">理念收束</span></div>
        </div>
        <blockquote style="margin:10px 0 0;padding:12px 14px;border-left:3px solid #8EE7FF; background:#FFFFFF10; border-radius:12px;">
          <p style="margin:0;line-height:1.8">${line}</p>
        </blockquote>
      </div>
    `;
  }
  function heroLine(ch){
    switch(ch){
      case "盾穩": return "你把訊號調回穩定，讓錯頻的時代再次同拍。";
      case "磁芮": return "吸引與排斥之間，你找到屬於自己的共振。";
      case "亂序": return "混沌不等於迷失；校準之後，方向更清晰。";
      default:     return "當訊號合拍，時代便回以共鳴。";
    }
  }
  function scoreFront(){
    const score = result.score ?? 0;
    const grade = result.grade || computeGrade(score);
    const total = result.logoPiecesTotal || 12;
    const runPct = clamp(((result.logoPiecesRun||0)/total)*100,0,100);
    const cumPct = clamp(result.logoCompletionCumulative ?? runPct,0,100);
    return `
      <div class="card__body">
        <div class="kpi">
          <div class="kpi__row"><span class="kpi__label">總分</span><span class="kpi__value">${toThousand(score)}</span></div>
          <div class="kpi__row"><span class="kpi__label">評級</span><span class="kpi__value">${grade}</span></div>
        </div>
        <div class="kpi" style="margin-top:8px">
          <div class="kpi__row"><span class="kpi__label">Logo 碎片完成度（累積）</span><span class="kpi__value">${Math.round(cumPct)}%</span></div>
        </div>
        <div class="ring-progress" style="--p:${cumPct/100}">
          <span>${Math.round(cumPct)}%</span>
        </div>
      </div>
    `;
  }
  function timeFront(){
    const s = Number(result.timeSurvived || 0);
    return `
      <div class="card__body">
        <div class="kpi">
          <div class="kpi__row"><span class="kpi__label">生存時間</span><span class="kpi__value">${fmtTime(s)}</span></div>
        </div>
        <p style="color:var(--muted);margin-top:10px">你讓時間的沙更慢地流動。</p>
      </div>
    `;
  }
  function distanceFront(){
    const dist = result.distance;
    const progress = result.progressPercent;
    const value = dist != null ? `${toThousand(dist)} m`
               : progress != null ? `${Math.round(progress)}%` : "—";
    return `
      <div class="card__body">
        <div class="kpi">
          <div class="kpi__row"><span class="kpi__label">距離／進度</span><span class="kpi__value">${value}</span></div>
        </div>
        <p style="color:var(--muted);margin-top:10px">越過的每一步，都是證據。</p>
      </div>
    `;
  }
  function leaderboardFront(){
    if(!leaderboard || !leaderboard.length){
      return `<div class="card__body"><p>尚無排行榜資料。玩幾局看看吧！</p></div>`;
    }
    const top5 = leaderboard.slice().sort((a,b)=> b.score-a.score || b.time-a.time).slice(0,5);
    const rankLine = result.rank!=null
      ? `<p style="margin:6px 0 0;color:var(--muted)">你的名次：<strong style="color:#8EE7FF">${result.rank}</strong>${result.isPersonalBest?"（個人最佳！）":""}</p>`
      : "";
    return `
      <div class="card__body">
        <ol class="list">
          ${top5.map((r,i)=>`
            <li>
              <span>${i+1}</span>
              <strong>${escapeHTML(r.name||"玩家")}</strong>
              <small>${toThousand(r.score)} 分 / ${fmtTime(Number(r.time||0))}</small>
            </li>
          `).join("")}
        </ol>
        ${rankLine}
      </div>
    `;
  }

/* ---------- 按鈕／分享 ---------- */
let btnAgain, btnShare, btnHome;

/** 永遠導向網站根目錄的 index.html
 *  例： https://your-domain.com/resonance.html
 *  若未來你放在子路徑（例如 /site/），把 ROOT_PATH 改成 "/site/" 即可。
 */
const ROOT_PATH = "/"; // ← 若未來部署在 /site/，改成 "/site/"
function buildExhibitURL(file = "index.html") {
  const clean = file.replace(/^\/+/, "");
  return `${location.origin}${ROOT_PATH}${clean}`;
}

// 放在 wireButtons() 上方，與其他常數放一起
const CHARACTER_PAGE = "/gamestuff/character.html"; 
// ^ 如果你的實際檔名是「charater.html」（少了個 'c'），請把這行改成："/gamestuff/charater.html"

const abs = (path)=> new URL(path.replace(/^\/+/, "/"), location.origin).href;


function wireButtons(){
  btnAgain = $("#btn-again");
  btnShare = $("#btn-share");
  btnHome  = $("#btn-home");

  btnAgain?.addEventListener("click", ()=>{
  try { localStorage.removeItem("gameResult"); } catch {}
  try { sessionStorage.removeItem("selectedCharacter"); } catch {}
  // 不再帶 ?character，讓玩家重新選角
  location.href = abs(CHARACTER_PAGE);
});


  btnHome?.addEventListener("click", ()=>{
    try { localStorage.removeItem("gameResult"); } catch {}
    location.href = buildExhibitURL("index.html"); // → 直接 /index.html
  });

  btnShare?.addEventListener("click", shareSnapshot);
}


  async function shareSnapshot(){
    const target = $(".ring-wrap"); if(!target) return;
    flash();
    try{
      const canvas = await html2canvas(target,{backgroundColor:"#0D0B15"});
      const blob = await new Promise(res=> canvas.toBlob(res,"image/png",0.92));
      const file = new File([blob], "result.png", {type:"image/png"});
      if (navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({ title:"我的結果｜時代共振", text:"這是我的遊戲結果，你也來試試！", files:[file] });
        return;
      }
      const url = URL.createObjectURL(blob); const a=document.createElement("a");
      a.href=url; a.download="result.png"; a.click(); URL.revokeObjectURL(url);
    }catch(err){ console.warn("分享失敗，已嘗試下載：", err); }
  }
  function flash(){ const el=$("#flash"); if(!el) return; el.classList.add("show"); setTimeout(()=> el.classList.remove("show"), 180); }

  /* ---------- 小工具 ---------- */
  function toThousand(n){ return Number(n||0).toLocaleString("zh-Hant"); }
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function spawnSpark(x,y){
    if(!sparkLayer) return;
    const s = document.createElement("div");
    s.className = "spark";
    s.style.left = `${x-2}px`; s.style.top = `${y-2}px`;
    sparkLayer.appendChild(s);
    setTimeout(()=> s.remove(), 520);
  }

  /* ---------- 啟動 ---------- */
  async function boot(){
    // DOM 參照
    ringEl = $("#ring");
    sparkLayer = $("#spark-layer");
    wireButtons();

    // 圖片預載＆套用背景，再掛卡片
    try{ await preloadImages(ASSETS); }catch{}
    applyBackground();
    mountCards();
  }

  // 讓外部 FX 能存取與包裝
window.__RESULT_API__ = {
  get ringEl(){ return ringEl; },
  get state(){ return state; },
  get result(){ return result; },
  get layout(){ return layout; }, set layout(fn){ layout = fn; },
  get animateRotationTo(){ return animateRotationTo; }, set animateRotationTo(fn){ animateRotationTo = fn; }
};


  boot(); // ← 只呼叫一次

})();


/* ============================================================
   FX PACK (standalone) — 背景/卡片/文字
   不取用原本 IIFE 變數；直接查 DOM 執行
============================================================ */
(function(){
  'use strict';
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s,el=document)=> el.querySelector(s);
  const throttle = (fn,t=300)=>{ let k=0; return (...a)=>{ const n=Date.now(); if(n-k>=t){ k=n; fn(...a);} }; };

  /* ---------- 背景層：星野 / 流星 / 砂塵 ---------- */
  const bg = $('.bg');
  if (bg){
    // 星野
    const starsFar  = document.createElement('div');
    const starsNear = document.createElement('div');
    starsFar.className  = 'fx-stars fx-stars--far';
    starsNear.className = 'fx-stars fx-stars--near';
    bg.appendChild(starsFar); bg.appendChild(starsNear);

    // 流星 & 砂塵容器
    const meteorLay = document.createElement('div');
    const dustLay   = document.createElement('div');
    meteorLay.id='meteor-layer'; dustLay.id='dust-layer';
    bg.appendChild(meteorLay); bg.appendChild(dustLay);

    // 視差（桌機）
    if (!prefersReduced && matchMedia('(pointer:fine)').matches){
      window.addEventListener('mousemove', throttle((e)=>{
        const x=(e.clientX/innerWidth-0.5), y=(e.clientY/innerHeight-0.5);
        starsFar.style.transform  = `translate(${x*-1.2}%, ${y*-1.6}%)`;
        starsNear.style.transform = `translate(${x* 1.6}%, ${y* 2.2}%)`;
      },16));
    }

    // 流星（單條、低頻）
    if (!prefersReduced){
      let meteorBusy=false;
      const next = ()=>{
        const base = matchMedia('(pointer:coarse)').matches ? 12000 : 7000;
        const jitter = 2000+Math.random()*4000;
        setTimeout(spawn, base+jitter);
      };
      const spawn = ()=>{
        if (meteorBusy){ next(); return; }
        meteorBusy=true;
        const m=document.createElement('div'); m.className='meteor';
        const sx=60+Math.random()*30, sy=5+Math.random()*25, dur=0.8+Math.random()*0.5;
        m.style.setProperty('--sx', sx+'vw');
        m.style.setProperty('--sy', sy+'vh');
        m.style.setProperty('--dur', dur+'s');
        meteorLay.appendChild(m);
        m.addEventListener('animationend', ()=>{ m.remove(); meteorBusy=false; next(); }, {once:true});
      };
      setTimeout(next, 1800);
    }

    // 砂塵（稀疏）
    const dustCount = prefersReduced ? 10 : 24;
    for(let i=0;i<dustCount;i++){
      const d=document.createElement('div');
      d.className='dust';
      d.style.left = (Math.random()*100)+'vw';
      d.style.setProperty('--x', (Math.random()*40-20)+'px');
      const t=5+Math.random()*4;
      d.style.setProperty('--t', t+'s');
      d.style.animationDelay = (Math.random()*t)+'s';
      dustLay.appendChild(d);
    }
  }

  /* ---------- 卡片互動：shine / hover-tilt / 中心變更監看 ---------- */
  const ring = $('#ring');
  const wrap = $('.ring-wrap');

  // 翻正面一次性掃光
  if (ring){
    ring.addEventListener('click', (e)=>{
      const card = e.target.closest('.card');
      if (!card) return;
      requestAnimationFrame(()=>{
        if (!card.classList.contains('flipped')){
          card.classList.add('shine');
          setTimeout(()=> card.classList.remove('shine'), 1000);
        }
      });
    });
  }

  // 中心卡監看（不依賴內部 layout，直接每 frame 檢查）
  let lastCenter = -1;
  function tick(){
    const el = ring?.querySelector('.card.is-center');
    const idx = el ? Number(el.dataset.index) : -1;
    if (idx !== lastCenter){
      onCenterChanged(idx, el);
      lastCenter = idx;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function onCenterChanged(idx, el){
    // 啟用/移除 tilt
    resetTiltOnAll();
    if (el) enableTiltOn(el);

    // 分數圓環 & 英雄語錄解碼（只跑一次）
    if (idx===1) animateScoreCard(el);
    if (idx===0) maybeDecodeHero(el);
  }

  // hover tilt（桌機）
  function enableTiltOn(cardEl){
    if (!wrap || !cardEl) return;
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const inner = cardEl.querySelector('.card-inner');
    const rect  = ()=> inner.getBoundingClientRect();
    const onMove = throttle((ev)=>{
      const r = rect();
      const cx = r.left+r.width/2, cy=r.top+r.height/2;
      const dx = (ev.clientX-cx)/(r.width/2);
      const dy = (ev.clientY-cy)/(r.height/2);
      const max=4;
      inner.style.setProperty('--tiltY', (dx*max).toFixed(2)+'deg');
      inner.style.setProperty('--tiltX', (-dy*max).toFixed(2)+'deg');
    },16);
    const onLeave = ()=>{ inner.style.setProperty('--tiltX','0deg'); inner.style.setProperty('--tiltY','0deg'); };
    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseleave', onLeave);
    cardEl._tilt = {onMove,onLeave};
  }
  function resetTiltOnAll(){
    ring?.querySelectorAll('.card').forEach(c=>{
      const inner = c.querySelector('.card-inner');
      inner?.style.setProperty('--tiltX','0deg');
      inner?.style.setProperty('--tiltY','0deg');
      if (c._tilt){
        wrap?.removeEventListener('mousemove', c._tilt.onMove);
        wrap?.removeEventListener('mouseleave', c._tilt.onLeave);
        delete c._tilt;
      }
    });
  }

  /* ---------- 文字：分數滾動 / 圓環掃過 / 英雄語錄解碼 ---------- */
  let scoreAnimated=false, heroDecoded=false;

  function animateScoreCard(cardEl){
    if (scoreAnimated || !cardEl) return;
    scoreAnimated=true;

    // 取值（從 DOM 拿數字與百分比）
    const scoreEl = cardEl.querySelector('.kpi__row:nth-child(1) .kpi__value');
    const ringEl  = cardEl.querySelector('.ring-progress');
    // 分數目標值就用 text 反算（避免存取內部 result 物件）
    const targetScore = (()=>{
      const txt = (scoreEl?.textContent||'0').replace(/[, ]/g,'');
      const n = parseInt(txt,10); return isNaN(n)?0:n;
    })();
    // 百分比從 ring 內的數字拿
    const pctText = (ringEl?.querySelector('span')?.textContent||'0').replace('%','');
    const pct = Math.max(0, Math.min(100, parseInt(pctText,10)||0));

    // 動畫：分數
    tweenNumber(scoreEl, targetScore, 520);
    // 動畫：圓環
    if (ringEl){
      const start=performance.now(), dur=650;
      (function step(now){
        const p = Math.min((now-start)/dur,1);
        const e = p<0.5 ? 2*p*p : -1+(4-2*p)*p;
        ringEl.style.setProperty('--p', (pct/100)*e);
        if (p<1) requestAnimationFrame(step);
      })(start);
    }
  }

  function tweenNumber(el, target, dur=500){
    if (!el) return;
    const start=performance.now(), from=0;
    (function tick(now){
      const p = Math.min((now-start)/dur,1);
      const e = p<0.5 ? 2*p*p : -1+(4-2*p)*p;
      const val = Math.round(from + (target-from)*e);
      el.textContent = val.toLocaleString('zh-Hant');
      if (p<1) requestAnimationFrame(tick);
    })(start);
  }

  function maybeDecodeHero(cardEl){
    if (heroDecoded || !cardEl) return;
    // 如果此時已翻到正面就直接跑；否則等點擊該卡翻正
    const go = ()=>{ decodeHeroQuote(cardEl); heroDecoded=true; };
    if (!cardEl.classList.contains('flipped')) go();
    else {
      const onClick = (e)=>{
        const t=e.target.closest('.card');
        if (t===cardEl){
          requestAnimationFrame(()=>{ if (!cardEl.classList.contains('flipped')){ go(); ring.removeEventListener('click',onClick);} });
        }
      };
      ring.addEventListener('click', onClick);
    }
  }

  function decodeHeroQuote(cardEl){
    const p = cardEl.querySelector('.card-front blockquote p');
    if (!p) return;
    const final = p.textContent;
    const chars = '△◇◆▢▣◻◼◽◾✶✦✧✩✪✫✬✭✮';
    let frame=0, total=Math.max(24, Math.floor(60*0.6));
    const timer=setInterval(()=>{
      frame++;
      const keep = Math.floor(final.length*(frame/total));
      const scramble = Array.from({length: final.length-keep}, ()=> chars[(Math.random()*chars.length)|0]).join('');
      p.textContent = final.slice(0,keep) + scramble;
      if (frame>=total){ clearInterval(timer); p.textContent=final; }
    },16);
  }
})();

(function(){
const A=window.__RESULT_API__; if(!A) return;
const O=A.animateRotationTo;
A.animateRotationTo=function(t,d=360){
  const s=A.state.rotation;
  let df=((t-s)%360+540)%360-180;
  const t0=performance.now(), k=1.10, ez=t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
  requestAnimationFrame(function step(n){
    const p=Math.min((n-t0)/d,1), e=ez(p);
    A.state.rotation = s + df*e*k - df*(k-1)*p;
    A.layout();
    if(p<1) requestAnimationFrame(step);
  });
};
})();
