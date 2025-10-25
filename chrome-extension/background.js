const PERSONAS = [
  { id: "robert",        name: "Robert Makłowicz" },
  { id: "kapitan-bomba", name: "Kapitan Bomba"    },
  { id: "yoda",          name: "Yoda"             }
];

chrome.runtime.onInstalled.addListener(refreshMenus);
chrome.storage.onChanged.addListener(ch => {
  if (ch.persona_id) refreshMenus(); // opcjonalnie
});

async function refreshMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: "przeinacz_root", title: "Przeinacz…", contexts: ["selection"] });
  PERSONAS.forEach(p => {
    chrome.contextMenus.create({
      id: `przeinacz_${p.id}`,
      parentId: "przeinacz_root",
      title: `W stylu: ${p.name}`,
      contexts: ["selection"]
    });
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;
  if (!info.menuItemId.startsWith("przeinacz_")) return;
  const personaId = info.menuItemId.replace("przeinacz_", "");
  chrome.tabs.sendMessage(tab.id, { type: "RUN_TRANSFORM", personaId, text: info.selectionText });
});
