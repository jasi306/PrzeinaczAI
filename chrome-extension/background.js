const ROOT_ID = "przeinacz_root";
let personasCache = [];
let currentMenu = [];

chrome.runtime.onInstalled.addListener(refreshMenus);
chrome.storage.onChanged.addListener((changes) => {
  if (changes.personas || changes.persona_id) refreshMenus();
});

async function refreshMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: ROOT_ID,
    title: "Przeinacz…",
    contexts: ["selection"]
  });

  const { personas } = await chrome.storage.sync.get(["personas"]);
  personasCache = Array.isArray(personas) && personas.length ? personas : [
    { id:"neutral", name:"Neutral" },
    { id:"kapitan-bomba", name:"Kapitan Bomba" }
  ];
  currentMenu = personasCache.map(p => {
    chrome.contextMenus.create({
      id: `przeinacz_${p.id}`,
      parentId: ROOT_ID,
      title: `W stylu: ${p.name}`,
      contexts: ["selection"]
    });
    return p.id;
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;
  if (!info.menuItemId.startsWith("przeinacz_")) return;
  const personaId = info.menuItemId.replace("przeinacz_", "");
  // You can send selection + persona to content.js or background->API here.
  chrome.tabs.sendMessage(tab.id, { type: "RUN_TRANSFORM", personaId, text: info.selectionText });
});

// Listen selection transform requests from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "RUN_TRANSFORM") {
    // For now just show toast; later call your API and replace selection.
    toast(`Persona: ${msg.personaId}\n${msg.text.slice(0, 80)}…`);
  }
});

function toast(text) {
  const el = document.createElement("div");
  el.textContent = text;
  el.style.cssText = `
    position:fixed; right:16px; bottom:16px; z-index:2147483647;
    background:rgba(0,0,0,.85); color:#fff; padding:10px 14px;
    border-radius:10px; max-width:320px; white-space:pre-wrap; font:12px/1.3 system-ui;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}