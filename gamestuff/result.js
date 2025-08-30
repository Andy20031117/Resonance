(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const qs = new URLSearchParams(location.search);
  const tiltRoot = $('#tiltRoot');
  const toast = $('#toast');

  // 讀取成績：優先 URL 參數，其次 localStorage.latestRun，最後 Demo
  function readResult(){
    const num = v => (v==null || v==="") ? null : Number(v);
    let data = {
      time: qs.get('time'), // 秒
      score: qs.get('score'),
      completion: qs.get('completion'), // 0~100
      combo: qs.get('combo'),
      evade: qs.get('evade'),
      hit: qs.get('hit')
    };
    if(Object.values(data).every(v => v==null)){
      try{
        const fromLS = JSON.parse(localStorage.getItem('latestRun')||'null');
        if(fromLS){ data = fromLS; }
      }catch{ /* ignore */ }
    }
    // Demo fallback
    if(Object.values(data).every(v => v==null)){
      data = { time: 92, score: 4310, completion: 78, combo: 15, evade: 42, hit: 3 };
    }
    // 型別正規化
    data.time = num(data.time) ?? 0;
    data.score = num(data.score) ?? 0;
    data.completion = Math.min(100, Math.max(0, num(data.completion) ?? 0));
    data.combo = num(data.combo) ?? 0;
    data.evade = num(data.evade) ?? 0;
    data.hit = num(data.hit) ?? 0;
    return data;
  }

  function timeFmt(sec){
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    const s = (sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function rankOf(score, completion){
    const v = score*0.7 + completion*30; // 簡單權重
    if(v>=8000) return 'S';
    if(v>=5500) return 'A';
    if(v>=3000) return 'B';
    return 'C';
  }

  function poemFor({time, score, completion}){
    const linesHigh = [
      '訊號對準，記憶如潮，',
      '你在像素海裡把風切開。',
      '沙漏翻轉，時間向你點頭，',
      '殘噪靜默，留下清亮的一行。'
    ];
    const linesMid = [
      '頻道偶爾失真，但不再迷航，',
      '你以穩定節奏穿過霧面光柵。',
      '微粒般的秒針撒落，',
      '下一次，就讓閃電更接近掌心。'
    ];
    const linesLow = [
      '失真未盡，訊號仍嘯叫。',
      '別急，呼吸，讓沙回到漏斗。',
      '當你再次啟動，',
      '螢光會記得你的方向。'
    ];

    const metric = score + completion*40 + time*10;
    const lines = metric > 12000 ? linesHigh : (metric > 6000 ? linesMid : linesLow);
    return `【結算詩】\n${lines.join('\n')}`;
  }

  function applyResult(data){
    $('#statTime').textContent = timeFmt(data.time);
    $('#statScore').textContent = data.score.toLocaleString();
    $('#statCompletion').textContent = `${data.completion}%`;
    $('#progressBar').style.width = `${data.completion}%`;
    $('#kpiCombo').textContent = data.combo;
    $('#kpiEvade').textContent = data.evade;
    $('#kpiHit').textContent = data.hit;
    const r = rankOf(data.score, data.completion);
    $('#statRank').textContent = r;
    $('#poem').textContent = poemFor(data);
  }

  function updateLeaderboard(data){
    const entry = {
      name: localStorage.getItem('playerName') || 'Explorer',
      score: data.score|0,
      time: data.time|0,
      completion: data.completion|0,
      ts: Date.now()
    };
    let list = [];
    try{ list = JSON.parse(localStorage.getItem('leaderboard')||'[]') }catch{}
    list.push(entry);
    list.sort((a,b)=> b.score - a.score || b.completion - a.completion || a.time - b.time);
    list = list.slice(0,10);
    localStorage.setItem('leaderboard', JSON.stringify(list));

    const ul = $('#boardList');
    ul.innerHTML = '';
    list.forEach((it, i)=>{
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="board-rank">#${(i+1).toString().padStart(2,'0')}</span>
        <span class="board-name">${it.name}</span>
        <span class="board-score">${it.score.toLocaleString()} · ${timeFmt(it.time)} · ${it.completion}%</span>
      `;
      ul.appendChild(li);
    });
  }

  function showToast(msg){
    toast.textContent = msg; toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), 1800);
  }

  // 3D Tilt（滑鼠＋陀螺儀）
  let gyroOn = true;
  function setTilt(x, y){
    // x,y: [-1,1]
    const rotY = x * 10;
    const rotX = -y * 10;
    tiltRoot.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }
  window.addEventListener('mousemove', (e)=>{
    if(!gyroOn) return;
    const r = tiltRoot.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width/2)) / (r.width/2);
    const ny = (e.clientY - (r.top + r.height/2)) / (r.height/2);
    setTilt(nx, ny);
  });
  if(window.DeviceOrientationEvent){
    window.addEventListener('deviceorientation', (e)=>{
      if(!gyroOn) return;
      const nx = Math.max(-1, Math.min(1, (e.gamma||0)/30));
      const ny = Math.max(-1, Math.min(1, (e.beta||0)/30));
      setTilt(nx, ny);
    });
  }
  window.addEventListener('keydown', (e)=>{
    if(e.key.toLowerCase()==='g'){
      gyroOn = !gyroOn;
      if(!gyroOn){ tiltRoot.style.transform = 'none'; }
      showToast(gyroOn? '3D 傾斜：開啟' : '3D 傾斜：關閉');
    }
  });

  // CTA
  $('#btnRetry').addEventListener('click', ()=>{
    const url = tiltRoot.dataset.retry || 'play.html';
    location.href = url;
  });
  $('#btnBack').addEventListener('click', ()=>{
    const url = tiltRoot.dataset.back || 'index.html';
    location.href = url;
  });
  $('#btnShare').addEventListener('click', async ()=>{
    const data = readResult();
    const shareUrl = new URL(location.href.split('#')[0]);
    shareUrl.search = new URLSearchParams({
      time: data.time, score: data.score, completion: data.completion
    }).toString();
    const title = '我的任務結算（Resonance）';
    const text = `生存 ${timeFmt(data.time)}｜分數 ${data.score}｜完成度 ${data.completion}%`;
    try{
      if(navigator.share){
        await navigator.share({ title, text, url: shareUrl.toString() });
      }else{
        await navigator.clipboard.writeText(`${title}\n${text}\n${shareUrl.toString()}`);
        showToast('已複製分享連結');
      }
    }catch(err){ showToast('取消分享'); }
  });

  // 初始化
  const result = readResult();
  applyResult(result);
  updateLeaderboard(result);

  // 將本次結果存回（供其他頁面或重新整理使用）
  try{ localStorage.setItem('latestRun', JSON.stringify(result)); }catch{}
})();
