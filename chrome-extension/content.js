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
    extractAndSendArticle(message.persona, message.absurd_level);
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
  return sessionStorage.getItem(cacheKey(url, persona, absurd_level)) !== null;
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
      title: article.title,
      persona: persona,
      absurd_level: absurd_level,
      personaDescription: personaDescription,
      textContent: article.textContent
    })
  });

  if (!response.ok) {
    console.error("❌ Server responded with an error:", response.status, response.statusText);
    return "";
  }

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

async function extractAndSendArticle(persona, absurd_level) {
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
      "Nie cenzuruj się, używaj wulgaryzmów i mów jak kapitan bomba z kreskówki."
    );
    setCachedValue(window.location.href, persona, absurd_level, transformedText);
  }

  if (!transformedText || typeof transformedText !== "string") {
    console.error("⚠️ No transformed text received from backend. ⚠️");
    return;
  }

  // 3. podmień zawartość artykułu na stronie
  replaceArticleBody(transformedText);

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
    // alert("⚠️ Nie znaleziono elementu <h1> do wstawienia nagłówka. ⚠️");
    return;
  }

  // jeśli już istnieje, tylko podmień treść
  const existing = document.getElementById("przeinaczai");
  if (existing) {
    const firstP = existing.getElementsByTagName("p")[0];
    if (firstP) {
      firstP.innerHTML = generated_text;
    }
    return;
  }

  // budujemy nowy banner
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

  const text = document.createElement("p");
  text.innerHTML = generated_text;
  text.style.margin = "0 0 14px";
  text.style.fontSize = "13px";
  text.style.lineHeight = "1.5";
  text.style.color = textColor;
  banner.appendChild(text);

  // dolny pasek gradientowy
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

  // stopka bannera
  const footer = document.createElement("div");
  footer.style.display = "flex";
  footer.style.alignItems = "center";
  footer.style.justifyContent = "space-between";
  footer.style.marginTop = "10px";
  footer.style.paddingTop = "10px";
  footer.style.borderTop = `1px solid ${border}`;

  // lewa strona stopki (avatar + label)
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
  avatar.textContent = "A"; // "author". symboliczne

  const AIlabel = document.createElement("span");
  AIlabel.textContent = "Generated by przeinaczAI";
  AIlabel.style.fontSize = "12px";
  AIlabel.style.color = muted;
  AIlabel.style.letterSpacing = ".2px";

  left.appendChild(avatar);
  left.appendChild(AIlabel);

  // prawa strona stopki (przycisk share)
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
  shareBtn.addEventListener("mouseenter", () => (shareBtn.style.transform = "translateY(-1px)"));
  shareBtn.addEventListener("mouseleave", () => (shareBtn.style.transform = "translateY(0)"));

  footer.appendChild(left);
  footer.appendChild(shareBtn);

  banner.appendChild(footer);

  // wstaw przed <h1>
  header.parentNode.insertBefore(banner, header);

  // animacja wejścia
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

    // bierzemy tylko 2 pierwsze zdania żeby nie lać kilometrowego TTS
    const sentences = fullTextForTTS
      .split(/(?<=[\.!\?])\s+/)
      .slice(0, 2)
      .join(" ");

    const url = await requestTTS(sentences, personaId);

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
window.addEventListener("load", () => {
  const defaultPersona = "kapitan-bomba";
  const defaultAbsurd = 5;
  extractAndSendArticle(defaultPersona, defaultAbsurd);
});
