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
