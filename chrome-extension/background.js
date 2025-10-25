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

// // Gdzie budujesz prompt/parametry:
// const { absurd_level = 50, persona_id = "robert" } = await chrome.storage.sync.get(["absurd_level", "persona_id"]);

// // Np. przełóż absurd_level (0–100) na temperature (0–1):
// const temperature = Math.min(1, Math.max(0, absurd_level / 100));

// // Możesz też zbudować wskazówkę stylu:
// const absurdHint =
//   absurd_level < 25 ? "Minimalne przerysowanie, bardziej faktograficznie." :
//   absurd_level < 50 ? "Lekka ironia i metafory oszczędnie." :
//   absurd_level < 75 ? "Wyraźne przerysowanie i humor, ale czytelnie." :
//                       "Mocny absurd i żart, skracaj i pointuj.";
