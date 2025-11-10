// /assets/js/test-logic.js
// --- 題庫（6題完整版） ---
// 欄位說明：
// id：題號
// text：題目敘述（維持詩意氛圍）
// options：[{ label：選項文字, key：對應主題鍵, weight：分數（2或3）}]
// multiplier：此題的整體加權（Q1=1.5、Q5=1.2，其餘=1）

export const QUESTIONS = [
  {
    id: "Q1",
    text: "你在半夢半醒之間走進一個空間。桌上有六樣微光物品。你伸手最先想拿起的是：",
    options: [
      { label: "一塊仍溫熱的麵包", key: "food",   weight: 3 },
      { label: "一件被風吹動的布料", key: "cloth", weight: 3 },
      { label: "一盞閃爍的老燈", key: "home",      weight: 3 },
      { label: "一段不知名的旋律", key: "fun",     weight: 3 },
      { label: "一本打開的筆記", key: "learn",     weight: 3 },
      { label: "一枚磨損的羅盤", key: "travel",    weight: 3 },
    ],
    // 開局影響較大
    multiplier: 1.5
  },
  {
    id: "Q2",
    text: "光線逐漸暗下，你面前出現三道門。你最終走向——",
    options: [
      { label: "傳來溫暖香氣的門", key: "food",  weight: 2 },
      { label: "透出微弱藍光的門", key: "fun",   weight: 2 },
      { label: "門後似乎傳來人聲的門", key: "learn", weight: 2 },
    ],
    multiplier: 1
  },
  {
    id: "Q3",
    text: "你聽見遠處傳來某種聲音，那聲音讓你停下腳步。那是——",
    options: [
      { label: "遠方列車的節奏聲", key: "travel", weight: 2 },
      { label: "樹葉輕擦的沙沙聲", key: "home",   weight: 2 },
      { label: "有人輕哼的旋律", key: "fun",      weight: 2 },
      { label: "筆尖劃過紙張的聲音", key: "learn", weight: 2 },
    ],
    multiplier: 1
  },
  {
    id: "Q4",
    text: "你撿起地上一個奇怪的小盒子，裡面似乎放著一件屬於你的東西。你希望它是——",
    options: [
      { label: "能讓你記起一段過去的照片", key: "home",   weight: 2 },
      { label: "一件從未見過的工具", key: "travel",        weight: 2 },
      { label: "一封寫給未來的信", key: "learn",            weight: 2 },
      { label: "一顆持續閃爍的光球", key: "fun",           weight: 2 },
    ],
    multiplier: 1
  },
  {
    id: "Q5",
    text: "你被帶到一條無人街道。四周的店家都亮著燈。你不知為何停在了——",
    options: [
      { label: "麵包店", key: "food",   weight: 3 },
      { label: "裁縫舖", key: "cloth",  weight: 3 },
      { label: "書報攤", key: "learn",  weight: 3 },
      { label: "老唱片行", key: "fun",  weight: 3 },
      { label: "旅館", key: "home",     weight: 3 },
      { label: "車站", key: "travel",   weight: 3 },
    ],
    // 加強一致性
    multiplier: 1.2
  },
  {
    id: "Q6",
    text: "當你走出那條街，天空出現一條金線。它在你耳邊低語：「你的頻率即將共振。」你想讓這道光帶你去哪裡？",
    options: [
      { label: "去看見「還沒發生的事」", key: "travel", weight: 2 },
      { label: "去回憶「已經忘記的自己」", key: "home", weight: 2 },
      { label: "去理解「無法解釋的情感」", key: "fun",  weight: 2 },
      { label: "去改變「不再運轉的時間」", key: "learn", weight: 2 },
    ],
    multiplier: 1
  }
];

// --- 初始分數 ---
export const INITIAL_SCORE = {
  food: 0, cloth: 0, home: 0, travel: 0, learn: 0, fun: 0
};

// --- 計分：套用單題選項（含題目 multiplier） ---
export function applyAnswer(score, option) {
  // option = { key, weight, multiplier }
  const w = option.weight * (option.multiplier || 1);
  score[option.key] += w;
  return score;
}

// --- 結果計算（支援雙頻） ---
export function computePersona(score) {
  const entries = Object.entries(score); // [[key, val], ...]
  entries.sort((a,b)=> b[1]-a[1]);
  const top = entries[0];
  const second = entries[1];
  const isDual = (top[1] - second[1]) <= 2;
  return {
    primary: top[0],
    secondary: isDual ? second[0] : null,
    isDual
  };
}

// --- 人格文案（可獨立抽成 JSON 供多語系/日後修改） ---
export const PERSONA_MAP = {
  food:   { name: "溫度的蒐集者", desc: "你以味覺記憶時代，總能在日常裡尋找溫度與安定。" },
  cloth:  { name: "表象的編織者", desc: "你以造型建構敘事，讓風格成為自我與時代的橋梁。" },
  home:   { name: "時光縫補者",   desc: "你修補舊物、整理空間，也整理自己與時間的關係。" },
  travel: { name: "流光旅人",     desc: "你不停前進並擁抱未知，因為移動本身就是答案。" },
  learn:  { name: "思索的播種者", desc: "你把思考灑進人心，等待知識在交流裡發芽。" },
  fun:    { name: "共鳴的製造者", desc: "你善於捕捉頻率，讓每一次相遇都化為旋律。" },
};

export function personaCopy(key) {
  return PERSONA_MAP[key] || { name: "未知頻率", desc: "我們還在校準你的共振訊號。" };
}

// --- 展區錨點（結果頁導向用） ---
export const CHANNEL_ANCHOR = {
  food: "#food", cloth: "#cloth", home: "#home",
  travel: "#travel", learn: "#learn", fun: "#fun"
};
