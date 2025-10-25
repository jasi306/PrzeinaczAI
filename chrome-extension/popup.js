// Fixed personas (no user edits)
const PERSONAS = [
  { id: "robert",        name: "Robert Makłowicz", img: "personas/robert.png" },
  { id: "kapitan-bomba", name: "Kapitan Bomba",    img: "personas/bomba.png"  },
  { id: "yoda",          name: "Yoda",             img: "personas/yoda.png"   }
];

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");

init();

async function init() {
  const { persona_id } = await chrome.storage.sync.get(["persona_id"]);
  render(persona_id || PERSONAS[0].id);
}

function render(selectedId) {
  grid.innerHTML = "";
  PERSONAS.forEach(p => {
    const card = document.createElement("button");
    card.className = "card" + (p.id === selectedId ? " active" : "");
    card.dataset.id = p.id;

    const img = document.createElement("img");
    img.src = p.img; img.alt = p.name;

    const name = document.createElement("div");
    name.className = "name"; name.textContent = p.name;

    card.append(img, name);
    card.addEventListener("click", () => selectPersona(p.id));
    grid.appendChild(card);
  });
}

async function selectPersona(id) {
  await chrome.storage.sync.set({ persona_id: id });
  chrome.runtime.sendMessage({ type: "SET_PERSONA", id });
  render(id);
  flash(`Wybrano: ${PERSONAS.find(p => p.id === id)?.name || id}`);
}

function flash(t) { statusEl.textContent = t; setTimeout(() => statusEl.textContent="", 1000); }
