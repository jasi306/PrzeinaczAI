// Default personas fallback
const DEFAULT_PERSONAS = [
  { id:"robert", name:"Robert Makłowicz" },
  { id:"bomba", name:"Kapitan Bomba" },
  { id:"yoda", name:"Yoda" },
];

const $persona = document.getElementById("persona");
const $status = document.getElementById("status");

init();

async function init() {
  const { personas, persona_id } = await chrome.storage.sync.get(["personas", "persona_id"]);
  const list = Array.isArray(personas) && personas.length ? personas : DEFAULT_PERSONAS;

  // Fill dropdown
  $persona.innerHTML = "";
  for (const p of list) {
    const opt = document.createElement("option");
    opt.value = p.id; opt.textContent = p.name;
    if (persona_id === p.id) opt.selected = true;
    $persona.appendChild(opt);
  }
}

document.getElementById("apply").addEventListener("click", async () => {
  const id = $persona.value;
  await chrome.storage.sync.set({ persona_id: id });
  // Notify other parts (content/background)
  chrome.runtime.sendMessage({ type: "SET_PERSONA", id });
  setStatus("Zapisano: " + id);
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

function setStatus(msg) {
  $status.textContent = msg;
  setTimeout(() => ($status.textContent = ""), 1500);
}
