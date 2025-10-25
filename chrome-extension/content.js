// =====================
// Kolory / style globalne
// =====================

const surface = "#ffffff";
const textColor = "#111827";
const muted = "#6b7280";
const ring = "#6366f1";
const accent = "#7c3aed";
const accent2 = "#22d3ee";
const border = "#e5e7eb";
const shadow = "0 8px 24px rgba(2,6,23,.08)";


// =====================
// Komunikacja z background / popup
// =====================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RUN_EXTRACTION") {
    extractAndSendArticle(message.persona, message.absurd_level, message.desc);
    sendResponse({ status: "Extraction started" });
  }
  return true;
});


// =====================
// Cache per URL + persona + absurd_level
// =====================

function cacheKey(url, persona, absurd_level) {
  return url + "_" + persona + "_" + absurd_level;
}

function doesCachedValueExist(url, persona, absurd_level) {
  if (sessionStorage.getItem(cacheKey(url, persona, absurd_level))) {
    return true;
  } else {
    return false;
  }
}

function getCachedValue(url, persona, absurd_level) {
  return sessionStorage.getItem(cacheKey(url, persona, absurd_level));
}

function setCachedValue(url, persona, absurd_level, value) {
  sessionStorage.setItem(cacheKey(url, persona, absurd_level), value);
}


// =====================
// Backend: pobieranie przerobionego tekstu
// =====================

async function getPersonaResponse(article, persona, absurd_level, personaDescription) {
  const response = await fetch("http://localhost:8000/text/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      //title: article.title,
      persona: persona,
      absurd_level: absurd_level,
      personaDescription: personaDescription,
      textContent: article.textContent
    })
  });

  // if (!response.ok) {
  //   console.error("❌ Server responded with an error:", response.status, response.statusText);
  //   return "";
  // }

  const result = await response.json();
  return result.msg;
}


// =====================
// Backend: TTS
// =====================

async function requestTTS(text, preset, speed) {
  const body = { text, preset };
  if (typeof speed === "number") body.speed = speed;

  const r = await fetch("http://localhost:8000/tts/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await r.json();
  return "http://localhost:8000" + data.download_url;
}


// =====================
// Główny flow na stronie
// =====================

async function extractAndSendArticle(persona, absurd_level, desc) {
  // 1. ekstrakcja artykułu
  const clone = document.cloneNode(true);
  const reader = new Readability(clone);
  const article = reader.parse();

  if (!article) {
    console.error("⚠️ No article content could be extracted. ⚠️");
    return;
  }

  // 2. pobierz przerobiony tekst (cache albo serwer)
  let transformedText;
  if (doesCachedValueExist(window.location.href, persona, absurd_level)) {
    transformedText = getCachedValue(window.location.href, persona, absurd_level);
  } else {
    transformedText = await getPersonaResponse(
      article,
      persona,
      absurd_level,
      desc
    );
    // alert(desc);
    setCachedValue(window.location.href, persona, absurd_level, transformedText);
  }

  if (!transformedText) {
    console.error("⚠️ No transformed text received from backend. ⚠️");
    return;
  }

  // 4. pokaż banner nad <h1>
  insertNewHeader(transformedText);

  // 5. pokaż mały widget "Generate TTS"
  createGenerateWidget(transformedText);
}


// =====================
// Wstrzyknięcie bannera nad <h1>
// =====================

async function insertNewHeader(generated_text) {
  const header = document.querySelector("h1");
  if (!header) {
    console.error("⚠️ No <h1> element found to insert the new header above. ⚠️");
    return;
  }

  // jeśli baner już jest, tylko aktualizujemy treść
  const existing = document.getElementById("przeinaczai");
  if (existing) {
    const firstP = existing.getElementsByTagName("p")[0];
    if (firstP) {
      firstP.innerHTML = generated_text;
    }
    return;
  }

  // kontener bannera
  const banner = document.createElement("div");
  banner.id = "przeinaczai";
  banner.style.position = "relative";
  banner.style.background = surface;
  banner.style.border = `1px solid ${border}`;
  banner.style.borderRadius = "12px";
  banner.style.padding = "20px 16px 14px";
  banner.style.boxShadow = `0 8px 24px #8d63d745`;
  banner.style.marginBottom = "20px";
  banner.style.overflow = "hidden";
  banner.style.opacity = "0";
  banner.style.transform = "translateY(10px)";
  banner.style.transition = "opacity 0.4s ease, transform 0.4s ease";

  // główny wygenerowany tekst
  const text = document.createElement("p");
  text.innerHTML = generated_text;
  text.style.margin = "0 0 14px";
  text.style.fontSize = "13px";
  text.style.lineHeight = "1.5";
  text.style.color = textColor;
  banner.appendChild(text);

  // dolny pasek barwny
  const bar = document.createElement("div");
  bar.style.position = "absolute";
  bar.style.bottom = "0";
  bar.style.left = "0";
  bar.style.right = "0";
  bar.style.height = "3px";
  bar.style.background = `linear-gradient(90deg, ${accent}, ${accent2})`;
  bar.style.borderBottomLeftRadius = "inherit";
  bar.style.borderBottomRightRadius = "inherit";
  banner.appendChild(bar);

  // stopka
  const footer = document.createElement("div");
  footer.style.display = "flex";
  footer.style.alignItems = "center";
  footer.style.justifyContent = "space-between";
  footer.style.marginTop = "10px";
  footer.style.paddingTop = "10px";
  footer.style.borderTop = `1px solid ${border}`;

  // lewa część stopki
  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "center";
  left.style.gap = "8px";

  const avatar = document.createElement("div");
  avatar.style.width = "28px";
  avatar.style.height = "28px";
  avatar.style.borderRadius = "50%";
  avatar.style.background = `conic-gradient(from 210deg, ${accent}, ${accent2})`;
  avatar.style.boxShadow = shadow;
  avatar.style.display = "grid";
  avatar.style.placeItems = "center";
  avatar.style.color = "#fff";
  avatar.style.fontWeight = "700";
  avatar.style.fontSize = "13px";
  avatar.textContent = "A";

  const AIlabel = document.createElement("span");
  AIlabel.textContent = "Generated by przeinaczAI";
  AIlabel.style.fontSize = "12px";
  AIlabel.style.color = muted;
  AIlabel.style.letterSpacing = ".2px";

  left.appendChild(avatar);
  left.appendChild(AIlabel);

  // prawa część stopki
  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "8px";


  // ======== helpery do ikon SVG (outline styl jak social, nie emoji) ========

  function svgThumbUp(color) {
    // "material-esque" thumb up outline
    // recognisable immediately as "like"
    const span = document.createElement("span");
    span.style.display = "block";
    span.style.lineHeight = "0";
    span.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 22V10a2 2 0 0 1 2-2h4.28a2 2 0 0 0 1.94-1.5l.38-1.52A2 2 0 0 1 19.5 3a2 2 0 0 1 2 2v2.47a4 4 0 0 1-.2 1.27l-2.12 6.37A2 2 0 0 1 17.3 17H13v5z"/>
        <path d="M2 10h3v12H2z"/>
      </svg>
    `;
    return span;
  }

  function svgThumbDown(color) {
    // mirrored vibe for dislike
    const span = document.createElement("span");
    span.style.display = "block";
    span.style.lineHeight = "0";
    span.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 2v12a2 2 0 0 1-2 2h-4.28a2 2 0 0 0-1.94 1.5l-.38 1.52A2 2 0 0 1 4.5 23a2 2 0 0 1-2-2v-2.47a4 4 0 0 1 .2-1.27l2.12-6.37A2 2 0 0 1 6.7 7H11V2z"/>
        <path d="M22 14h-3V2h3z"/>
      </svg>
    `;
    return span;
  }

  // kolory do stanów
  const neutralBorder = "#d1d5db";           // jasny szary ramka neutralna
  const neutralText = "#6b7280";             // szary tekst / ikona neutral
  const likeActiveColor = "#10b981";         // zielony
  const dislikeActiveColor = "#ef4444";      // czerwony

  // ======== LIKE button ========

  const likeBtn = document.createElement("button");
  likeBtn.style.display = "flex";
  likeBtn.style.alignItems = "center";
  likeBtn.style.gap = "6px";
  likeBtn.style.padding = "6px 10px";
  likeBtn.style.height = "32px";
  likeBtn.style.borderRadius = "8px";
  likeBtn.style.border = `1px solid ${neutralBorder}`;
  likeBtn.style.background = "transparent";
  likeBtn.style.cursor = "pointer";
  likeBtn.style.boxShadow = shadow;
  likeBtn.style.fontSize = "12px";
  likeBtn.style.fontWeight = "600";
  likeBtn.style.lineHeight = "1";
  likeBtn.style.color = neutralText;
  likeBtn.setAttribute("aria-pressed", "false");

  const likeIcon = svgThumbUp(neutralText);
  const likeLabel = document.createElement("span");
  likeLabel.textContent = "Like";
  likeLabel.style.display = "block";

  likeBtn.appendChild(likeIcon);
  likeBtn.appendChild(likeLabel);

  // ======== DISLIKE button ========

  const dislikeBtn = document.createElement("button");
  dislikeBtn.style.display = "flex";
  dislikeBtn.style.alignItems = "center";
  dislikeBtn.style.gap = "6px";
  dislikeBtn.style.padding = "6px 10px";
  dislikeBtn.style.height = "32px";
  dislikeBtn.style.borderRadius = "8px";
  dislikeBtn.style.border = `1px solid ${neutralBorder}`;
  dislikeBtn.style.background = "transparent";
  dislikeBtn.style.cursor = "pointer";
  dislikeBtn.style.boxShadow = shadow;
  dislikeBtn.style.fontSize = "12px";
  dislikeBtn.style.fontWeight = "600";
  dislikeBtn.style.lineHeight = "1";
  dislikeBtn.style.color = neutralText;
  dislikeBtn.setAttribute("aria-pressed", "false");

  const dislikeIcon = svgThumbDown(neutralText);
  const dislikeLabel = document.createElement("span");
  dislikeLabel.textContent = "Dislike";
  dislikeLabel.style.display = "block";

  dislikeBtn.appendChild(dislikeIcon);
  dislikeBtn.appendChild(dislikeLabel);

  // ======== SHARE button ========

  const shareBtn = document.createElement("button");
  shareBtn.textContent = "Share";
  shareBtn.style.padding = "6px 12px";
  shareBtn.style.border = "none";
  shareBtn.style.borderRadius = "8px";
  shareBtn.style.background = `linear-gradient(90deg, ${accent}, ${accent2})`;
  shareBtn.style.color = "#fff";
  shareBtn.style.fontSize = "12px";
  shareBtn.style.fontWeight = "600";
  shareBtn.style.letterSpacing = ".2px";
  shareBtn.style.boxShadow = shadow;
  shareBtn.style.cursor = "pointer";
  shareBtn.style.transition = "transform .1s ease";
  shareBtn.addEventListener("mouseenter", () => {
    shareBtn.style.transform = "translateY(-1px)";
  });
  shareBtn.addEventListener("mouseleave", () => {
    shareBtn.style.transform = "translateY(0)";
  });

  // ======== logika stanu Like/Dislike (YTb-style exclusivity) ========

  function setLikeActive() {
    // like aktywny
    likeBtn.style.border = `1px solid ${likeActiveColor}`;
    likeBtn.style.background = "rgba(16,185,129,0.12)";
    likeBtn.style.color = likeActiveColor;
    likeBtn.firstChild.innerHTML = svgThumbUp(likeActiveColor).innerHTML;
    likeBtn.setAttribute("aria-pressed", "true");

    // dislike nieaktywny
    dislikeBtn.style.border = `1px solid ${neutralBorder}`;
    dislikeBtn.style.background = "transparent";
    dislikeBtn.style.color = neutralText;
    dislikeBtn.firstChild.innerHTML = svgThumbDown(neutralText).innerHTML;
    dislikeBtn.setAttribute("aria-pressed", "false");
  }

  function setDislikeActive() {
    // dislike aktywny
    dislikeBtn.style.border = `1px solid ${dislikeActiveColor}`;
    dislikeBtn.style.background = "rgba(239,68,68,0.12)";
    dislikeBtn.style.color = dislikeActiveColor;
    dislikeBtn.firstChild.innerHTML = svgThumbDown(dislikeActiveColor).innerHTML;
    dislikeBtn.setAttribute("aria-pressed", "true");

    // like nieaktywny
    likeBtn.style.border = `1px solid ${neutralBorder}`;
    likeBtn.style.background = "transparent";
    likeBtn.style.color = neutralText;
    likeBtn.firstChild.innerHTML = svgThumbUp(neutralText).innerHTML;
    likeBtn.setAttribute("aria-pressed", "false");
  }

  function clearBoth() {
    likeBtn.style.border = `1px solid ${neutralBorder}`;
    likeBtn.style.background = "transparent";
    likeBtn.style.color = neutralText;
    likeBtn.firstChild.innerHTML = svgThumbUp(neutralText).innerHTML;
    likeBtn.setAttribute("aria-pressed", "false");

    dislikeBtn.style.border = `1px solid ${neutralBorder}`;
    dislikeBtn.style.background = "transparent";
    dislikeBtn.style.color = neutralText;
    dislikeBtn.firstChild.innerHTML = svgThumbDown(neutralText).innerHTML;
    dislikeBtn.setAttribute("aria-pressed", "false");
  }

  likeBtn.addEventListener("click", () => {
    if (likeBtn.getAttribute("aria-pressed") === "true") {
      // klik drugi raz -> wyłącz
      clearBoth();
    } else {
      setLikeActive();
    }
  });

  dislikeBtn.addEventListener("click", () => {
    if (dislikeBtn.getAttribute("aria-pressed") === "true") {
      clearBoth();
    } else {
      setDislikeActive();
    }
  });

  // prawa część: like | dislike | share
  right.appendChild(likeBtn);
  right.appendChild(dislikeBtn);
  right.appendChild(shareBtn);

  // składamy stopkę
  footer.appendChild(left);
  footer.appendChild(right);

  banner.appendChild(footer);

  // wstawiamy przed h1
  header.parentNode.insertBefore(banner, header);

  // animowane wejście
  requestAnimationFrame(() => {
    banner.style.opacity = "1";
    banner.style.transform = "translateY(0)";
  });
}



// =====================
// Podmiana treści artykułu w DOM
// =====================

function replaceArticleBody(newHTML) {
  let target = document.querySelector("article");

  if (!target) {
    const candidates = Array.from(
      document.querySelectorAll("main, .content, .post, .article, [role='main']")
    );
    target = pickBiggestTextBlock(candidates);
  }

  if (!target) {
    target = document.body;
  }

  target.innerHTML = newHTML;
}

function pickBiggestTextBlock(nodes) {
  let best = null;
  let bestScore = 0;
  nodes.forEach(n => {
    const txt = n.innerText || "";
    const score = txt.length;
    if (score > bestScore) {
      bestScore = score;
      best = n;
    }
  });
  return best;
}


// =====================
// Mini-widget "Generate TTS"
// =====================

function createGenerateWidget(fullTextForTTS) {
  let personaId = "kapitan-bomba";

  try {
    const maybe = chrome.storage?.sync?.get?.(["persona_id"]);
    if (maybe && typeof maybe.then === "function") {
      maybe.then(v => {
        if (v.persona_id) personaId = v.persona_id;
        setupAvatar();
      });
    } else if (chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(["persona_id"], v => {
        if (v.persona_id) personaId = v.persona_id;
        setupAvatar();
      });
    }
  } catch {
    // brak storage nie jest krytyczny
  }

  const PERSONA_IMG = {
    "geralt": "personas/geralt.png",
    "robert": "personas/robert.png",
    "kapitan-bomba": "personas/bomba.png"
  };

  const box = document.createElement("div");
  box.style.cssText = [
    "position:fixed",
    "z-index:2147483647",
    "width:220px",
    "padding:12px",
    "background:#111",
    "color:#fff",
    "border-radius:12px",
    "box-shadow:0 8px 24px rgba(0,0,0,.4)",
    "font:13px system-ui, Arial",
    "user-select:none",
    "cursor:move",
    "right:16px",
    "bottom:16px",
    "display:flex",
    "align-items:center",
    "gap:10px"
  ].join(";");

  const avatar = new Image();
  avatar.alt = "persona";
  avatar.style.cssText = [
    "width:48px",
    "height:48px",
    "border-radius:8px",
    "object-fit:cover",
    "box-shadow:0 4px 12px rgba(0,0,0,.35)",
    "pointer-events:none",
    "background:#222",
    "flex-shrink:0"
  ].join(";");

  function setupAvatar() {
    const rel = PERSONA_IMG[personaId] || PERSONA_IMG["geralt"];
    avatar.src = chrome.runtime.getURL(rel);
  }
  // pierwsze ustawienie
  setupAvatar();

  const btn = document.createElement("button");
  btn.textContent = "Generate TTS";
  btn.style.cssText = [
    "flex:1",
    "padding:8px 10px",
    "border:0",
    "border-radius:8px",
    "background:#2a2a2a",
    "color:#fff",
    "cursor:pointer",
    "text-align:center",
    "line-height:1.2"
  ].join(";");

  box.appendChild(avatar);
  box.appendChild(btn);

  document.documentElement.appendChild(box);

  // drag and drop mini-boxa
  let drag = false, sx = 0, sy = 0, st = 0, sl = 0;
  box.addEventListener("mousedown", e => {
    const t = e.target.tagName;
    if (t === "BUTTON" || t === "INPUT") return;
    drag = true;
    sx = e.clientX;
    sy = e.clientY;
    const r = box.getBoundingClientRect();
    st = r.top;
    sl = r.left;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp, { once:true });
    e.preventDefault();
  });

  function onMove(e) {
    if (!drag) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    box.style.top  = Math.max(8, st + dy) + "px";
    box.style.left = Math.max(8, sl + dx) + "px";
    box.style.right = "";
    box.style.bottom = "";
  }

  function onUp() {
    drag = false;
    document.removeEventListener("mousemove", onMove);
  }

  // kliknięcie "Generate TTS"
  btn.addEventListener("click", async () => {
    btn.textContent = "Generuję...";
    btn.disabled = true;
    btn.style.opacity = "0.6";

    const url = await requestTTS(fullTextForTTS, personaId);

    // chowamy widget po kliknięciu
    box.remove();

    // uruchamiamy duży player
    if (typeof window.player === "function") {
      window.player(url, personaId);
    } else {
      console.error("Player function not found on window");
    }
  });
}


// =====================
// Auto-start na load strony
// =====================
// Jeśli chcesz tylko przez popup, usuń ten blok
// window.addEventListener("load", () => {
//   const defaultPersona = "kapitan-bomba";
//   const defaultAbsurd = 5;
//   extractAndSendArticle(defaultPersona, defaultAbsurd);
// });
