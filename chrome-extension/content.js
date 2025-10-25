console.log("saniycheck")

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "RUN_TRANSFORM") {
    toast(`Persona: ${msg.personaId}\n${msg.text.slice(0, 80)}…`);
    // tu później: wywołanie Twojego API i podmiana zaznaczenia
  }
  if (msg?.type === "SET_PERSONA") {
    toast(`Ustawiono: ${msg.id}`);
  }
});

function toast(text) {
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText = `
    position:fixed; right:16px; bottom:16px; z-index:2147483647;
    background:rgba(0,0,0,.85); color:#fff; padding:10px 14px;
    border-radius:10px; max-width:320px; white-space:pre-wrap; font:12px/1.35 system-ui;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}


fetch('http://127.0.0.1:8000/prompt/?msg="zwroc mi cytat kapitana bomby"')
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    console.log('Data fetched:', data.msg);
  })
  .catch((error) => {
    console.error('Fetch error:', error);
  });



// PoC: odtwarzacz z avatarem powiązanym z wybraną personą i sensownym layoutem
(() => {
  if (window.__mini_audio_player__) return;
  window.__mini_audio_player__ = true;

  const AUDIO_URL = chrome.runtime.getURL("personas/tmp.mp3");

  // mapowanie id persony na obraz
  const PERSONA_IMG = {
    "robert": "personas/robert.png",
    "kapitan-bomba": "personas/bomba.png",
    "yoda": "personas/yoda.png"
  };

  // utwórz UI
  const wrap = document.createElement("div");
  wrap.style.cssText = [
    "position:fixed",
    "z-index:2147483647",
    "width:360px",
    "padding:12px",
    "background:#111",
    "color:#fff",
    "border-radius:12px",
    "box-shadow:0 8px 24px rgba(0,0,0,.4)",
    "font:13px system-ui, Arial",
    "user-select:none",
    "cursor:move",
    "right:16px",
    "bottom:16px"
  ].join(";");

  // kolumna z kontrolkami obok avatara
  const body = document.createElement("div");
  body.style.cssText = [
    "display:grid",
    "grid-template-columns:72px 1fr",
    "gap:10px",
    "align-items:center"
  ].join(";");

  const avatar = new Image();
  avatar.alt = "narrator";
  avatar.style.cssText = [
    "width:64px",
    "height:64px",
    "min-width:48px",
    "min-height:48px",
    "max-width:96px",
    "max-height:96px",
    "border-radius:8px",
    "object-fit:cover",
    "box-shadow:0 4px 12px rgba(0,0,0,.35)",
    "pointer-events:none",
    "background:#222"
  ].join(";");

  const controls = document.createElement("div");

  const seek = document.createElement("input");
  seek.type = "range";
  seek.min = "0";
  seek.max = "1000";
  seek.value = "0";
  seek.step = "1";
  seek.style.cssText = [
    "width:100%",
    "margin:0 0 8px 0",
    "height:6px",
    "background:#444",
    "border-radius:999px",
    "cursor:pointer"
  ].join(";");

  const time = document.createElement("div");
  time.textContent = "00:00 / 00:00";
  time.style.cssText = "opacity:.85; margin-bottom:8px; font-variant-numeric:tabular-nums";

  const row = document.createElement("div");
  row.style.cssText = "display:flex; gap:8px; align-items:center";

  const btnBack = document.createElement("button");
  btnBack.textContent = "⟲ -5s";
  btnBack.style.cssText = "padding:6px 10px; border:0; border-radius:8px; background:#2a2a2a; color:#fff; cursor:pointer";

  const btnPlay = document.createElement("button");
  btnPlay.textContent = "Play";
  btnPlay.style.cssText = "padding:6px 10px; border:0; border-radius:8px; background:#2a2a2a; color:#fff; cursor:pointer";

  const btnFwd = document.createElement("button");
  btnFwd.textContent = "+5s ⟳";
  btnFwd.style.cssText = "padding:6px 10px; border:0; border-radius:8px; background:#2a2a2a; color:#fff; cursor:pointer";

  row.append(btnBack, btnPlay, btnFwd);
  controls.append(seek, time, row);

  body.append(avatar, controls);
  wrap.append(body);
  document.documentElement.appendChild(wrap);

  // audio poza widokiem, ale w dokumencie
  const audio = document.createElement("audio");
  audio.src = AUDIO_URL;
  audio.preload = "auto";
  audio.style.display = "none";
  document.documentElement.appendChild(audio);

  // start w prawym dolnym i przejście na top oraz left dla drag
  const r0 = wrap.getBoundingClientRect();
  wrap.style.right = "";
  wrap.style.bottom = "";
  wrap.style.left = Math.max(8, window.innerWidth - r0.width - 16) + "px";
  wrap.style.top  = Math.max(8, window.innerHeight - r0.height - 16) + "px";

  // wybór avatara zgodny z ustawioną personą
  function setAvatarByPersona(id) {
    const rel = PERSONA_IMG[id] || PERSONA_IMG["robert"];
    avatar.src = chrome.runtime.getURL(rel);
  }
  // odczyt jednorazowy przy starcie
  try {
    const maybePromise = chrome.storage.sync.get(["persona_id"]);
    if (maybePromise && typeof maybePromise.then === "function") {
      maybePromise.then(v => setAvatarByPersona(v.persona_id));
    } else {
      chrome.storage.sync.get(["persona_id"], v => setAvatarByPersona(v.persona_id));
    }
  } catch {
    setAvatarByPersona("robert");
  }

  // sterowanie
  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
  }
  function syncUI() {
    const dur = isFinite(audio.duration) ? audio.duration : 0;
    time.textContent = fmt(audio.currentTime) + " / " + fmt(dur);
    if (dur > 0) seek.value = String(Math.round(audio.currentTime / dur * 1000));
    btnPlay.textContent = audio.paused ? "Play" : "Pauza";
  }

  btnPlay.onclick = () => { audio.paused ? audio.play() : audio.pause(); syncUI(); };
  btnBack.onclick = () => { audio.currentTime = Math.max(0, audio.currentTime - 5); };
  btnFwd.onclick  = () => {
    const dur = isFinite(audio.duration) ? audio.duration : 0;
    audio.currentTime = dur > 0 ? Math.min(dur, audio.currentTime + 5) : audio.currentTime;
  };
  seek.oninput = () => {
    const dur = isFinite(audio.duration) ? audio.duration : 0;
    if (dur > 0) audio.currentTime = Number(seek.value) / 1000 * dur;
  };

  audio.onloadedmetadata = syncUI;
  audio.ontimeupdate = syncUI;
  audio.onplay = syncUI;
  audio.onpause = syncUI;
  audio.onerror = () => console.error("Audio load error", audio.error, AUDIO_URL);
  avatar.addEventListener("error", () => console.error("Image load error", avatar.src));

  // przeciąganie całego panelu
  let drag = false, sx = 0, sy = 0, st = 0, sl = 0;
  wrap.addEventListener("mousedown", e => {
    const t = e.target.tagName;
    if (t === "BUTTON" || t === "INPUT") return;
    drag = true;
    sx = e.clientX;
    sy = e.clientY;
    const r = wrap.getBoundingClientRect();
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
    wrap.style.top  = Math.max(8, st + dy) + "px";
    wrap.style.left = Math.max(8, sl + dx) + "px";
  }
  function onUp() {
    drag = false;
    document.removeEventListener("mousemove", onMove);
  }
})();
