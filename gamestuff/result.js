(function () {
  // ===== 導覽路徑 =====
  const SELECT_PAGE = "character.html";  // ← 角色選擇頁（若檔名不同，改這裡）
  const EXPO_HOME   = "../resonance.html";

  // 角色詩句（可自由微調）
  const POEMS = {
    Dunwen:{ text:"我把失敗折成一紙飛行路徑，沿著風的紋理回望，才知道躍起之前，心也需要落地。", meta:"— 盾穩 / 在失速之後，找到穩住的方式" },
    Zirui:{  text:"磁場散去時，碎片仍會朝你靠近。別急著抓住它們，讓時間把圖案對準。",          meta:"— 磁芮 / 對準頻率，也對準自己" },
    Runxo:{  text:"穿越是瞬間的，理解是慢慢的。下一次換我不急著飛，只把步伐放進節拍裡。",      meta:"— 亂序 / 對齊節奏，重組次序" },
    "—":    { text:"當雜訊退去，願你仍記得，心跳也是一種節拍。",                                meta:"— 展覽記憶 / Resonance of the era" }
  };

  // 讀資料
  const d = readResult();
  render(d);
  bind(d);

  function readResult(){
    const score     = toInt(localStorage.getItem("finalScore"), 0);
    const bestScore = toInt(localStorage.getItem("bestScore"), 0);
    const timeMs    = toInt(localStorage.getItem("timeSurvivedMs"), 0);
    const maxDodge  = toInt(localStorage.getItem("maxDodge"), 0);
    const character = localStorage.getItem("characterName") || "—";
    const cause     = localStorage.getItem("gameOverCause") || "訊號雜訊過高";

    if (score > bestScore) localStorage.setItem("bestScore", String(score));
    return { score, bestScore: Math.max(score, bestScore), timeMs, maxDodge, character, cause };
  }

  function render(x){
    set("score",      num(x.score));
    set("bestScore",  num(x.bestScore));
    set("time",       clock(x.timeMs));
    set("maxDodge",   num(x.maxDodge));
    set("character",  x.character);
    set("cause",      x.cause);

    // NEW 標章
    const snap = toInt(localStorage.getItem("bestScore_prev"), -1);
    if (x.score > snap && x.score >= x.bestScore && x.score !== 0) id("newRecord").classList.remove("hidden");
    localStorage.setItem("bestScore_prev", String(x.bestScore));

    // 詩句
    const p = POEMS[x.character] || POEMS["—"];
    id("poemText").textContent = p.text;
    id("poemMeta").textContent = p.meta;
  }

  function bind(x){
    id("btnRetry").addEventListener("click", () => location.href = SELECT_PAGE);
    id("btnMenu").addEventListener("click",  () => location.href = EXPO_HOME);
    id("btnShare").addEventListener("click", async () => {
      const text = [
        "《AI×像素科技跑酷》結果",
        `分數：${num(x.score)}`,
        `最佳分數：${num(x.bestScore)}`,
        `生存時間：${clock(x.timeMs)}`,
        `最高閃避次數：${num(x.maxDodge)}`,
        `角色：${x.character}`,
        `失敗原因：${x.cause}`,
        "",
        "—— 送你的話 ——",
        id("poemText").textContent,
        id("poemMeta").textContent
      ].join("\n");

      try {
        if (navigator.share) await navigator.share({ title:"我的遊戲結果", text });
        else { await navigator.clipboard.writeText(text); flash(id("btnShare")); }
      } catch {
        try { await navigator.clipboard.writeText(text); flash(id("btnShare")); } catch {}
      }
    });
  }

  // Utils
  function id(s){ return document.getElementById(s) }
  function set(s,v){ id(s).textContent = v }
  function toInt(v,def=0){ const n=parseInt(v,10); return Number.isFinite(n)?n:def }
  function num(n){ return n.toLocaleString("zh-Hant-TW") }
  function clock(ms){ const s=Math.floor(ms/1000); return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}` }
  function flash(btn){ const t=btn.textContent; btn.textContent="已複製！"; setTimeout(()=>btn.textContent=t, 1000) }
})();
